import { Injectable, OnModuleInit, OnModuleDestroy, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ModbusRTU from 'modbus-serial';
import { IpValidator } from './utils/ip-validator';
import { SlaveIdValidator } from './utils/slave-id-validator';

export interface ModbusReadRequest {
  type: 'holding' | 'input' | 'coil' | 'discrete';
  address: number;
  quantity: number;
}

export interface ModbusValue {
  address: number;
  rawValue: number;
}

export interface ModbusReadResponse {
  success: boolean;
  type: string;
  values: ModbusValue[];
  timestamp: string;
}

export interface DeviceConfig {
  host: string;
  port: number;
  slaveId: number;
  connectionType: string;
  timeout: number;
}

export interface ConnectionStatus {
  connected: boolean;
  host: string;
  port: number;
  slaveId: number;
  lastError?: string;
  lastConnected?: Date;
}

@Injectable()
export class ModbusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModbusService.name);
  private client: ModbusRTU | null = null;
  private config: DeviceConfig;
  private connectionStatus: ConnectionStatus;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private reconnectDelay = 2000; // 2 seconds

  constructor(private configService: ConfigService) {
    this.config = this.loadConfig();
    this.validateConfig();
    this.connectionStatus = {
      connected: false,
      host: this.config.host,
      port: this.config.port,
      slaveId: this.config.slaveId,
    };
  }

  private loadConfig(): DeviceConfig {
    const host = this.configService.get<string>('MODBUS_HOST', '192.168.100.40');
    const port = this.configService.get<number>('MODBUS_PORT', 5000); // Changed to 5000
    const slaveId = this.configService.get<number>('MODBUS_SLAVE_ID', 1);
    const timeout = this.configService.get<number>('MODBUS_TIMEOUT', 3000); // Increased to 3s

    return {
      host,
      port,
      slaveId,
      connectionType: 'TCP',
      timeout,
    };
  }

  private validateConfig(): void {
    // Validate IP address
    if (!IpValidator.isValidModbusIp(this.config.host)) {
      const errorMsg = IpValidator.getIpErrorMessage(this.config.host);
      this.logger.error(`Invalid Modbus IP: ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }

    // Validate Slave ID
    if (!SlaveIdValidator.isValid(this.config.slaveId)) {
      const errorMsg = SlaveIdValidator.getErrorMessage(this.config.slaveId);
      this.logger.error(`Invalid Slave ID: ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      throw new BadRequestException(`Port must be in range 1-65535. Got: ${this.config.port}`);
    }

    this.logger.log(`Modbus configuration validated: ${this.config.host}:${this.config.port}, Slave ID: ${this.config.slaveId}`);
  }

  async onModuleInit() {
    this.logger.log('Initializing Modbus service...');
    this.logger.log(`Device IP Range: 192.168.100.1 - 192.168.100.255`);
    this.logger.log(`Port: ${this.config.port}`);
    this.logger.log(`Slave ID Range: 1-255`);
    // Connection will be established on first use (lazy connection)
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Get current device configuration
   */
  getConfig(): DeviceConfig {
    return { ...this.config };
  }

  /**
   * Update device configuration dynamically
   */
  async updateConfig(newConfig: Partial<DeviceConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    
    // Merge new config
    this.config = { ...this.config, ...newConfig };
    
    // Validate new config
    try {
      this.validateConfig();
    } catch (error) {
      // Revert on validation failure
      this.config = oldConfig;
      throw error;
    }

    // Disconnect existing connection if config changed
    if (this.client && this.client.isOpen) {
      this.logger.log('Configuration changed, reconnecting...');
      await this.disconnect();
    }

    this.connectionStatus = {
      connected: false,
      host: this.config.host,
      port: this.config.port,
      slaveId: this.config.slaveId,
    };

    this.logger.log(`Configuration updated: ${this.config.host}:${this.config.port}, Slave ID: ${this.config.slaveId}`);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      ...this.connectionStatus,
      connected: this.client?.isOpen || false,
    };
  }

  /**
   * Test connection to Modbus device
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const client = await this.getClient(true); // Force new connection
      
      // Try to read a single holding register at address 0 as a test
      try {
        await client.readHoldingRegisters(0, 1);
        this.connectionStatus.connected = true;
        this.connectionStatus.lastConnected = new Date();
        this.connectionStatus.lastError = undefined;
        this.reconnectAttempts = 0;
        
        return {
          success: true,
          message: `Successfully connected to ${this.config.host}:${this.config.port} (Slave ID: ${this.config.slaveId})`,
        };
      } catch (readError: any) {
        // Connection established but read failed - might be address issue
        this.connectionStatus.connected = true;
        this.connectionStatus.lastConnected = new Date();
        return {
          success: true,
          message: `Connected to device but test read failed (address might be invalid): ${readError.message}`,
        };
      }
    } catch (error: any) {
      this.connectionStatus.connected = false;
      this.connectionStatus.lastError = error.message;
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  private async getClient(forceReconnect = false): Promise<ModbusRTU> {
    // Check if we have a valid connection
    if (!forceReconnect && this.client && this.client.isOpen) {
      return this.client;
    }

    // Close existing connection if forcing reconnect
    if (forceReconnect && this.client) {
      await this.disconnect();
    }

    // Create new client
    this.client = new ModbusRTU();

    try {
      this.logger.log(`Connecting to Modbus TCP device at ${this.config.host}:${this.config.port}...`);
      
      await this.client.connectTCP(this.config.host, {
        port: this.config.port,
      });

      this.client.setID(this.config.slaveId);
      this.client.setTimeout(this.config.timeout);

      this.connectionStatus.connected = true;
      this.connectionStatus.lastConnected = new Date();
      this.connectionStatus.lastError = undefined;
      this.reconnectAttempts = 0;

      this.logger.log(
        `✓ Connected to Modbus TCP device at ${this.config.host}:${this.config.port} (Slave ID: ${this.config.slaveId})`,
      );

      return this.client;
    } catch (error: any) {
      this.client = null;
      this.connectionStatus.connected = false;
      this.connectionStatus.lastError = error.message;
      this.reconnectAttempts++;

      const errorMessage = `Failed to connect to Modbus device at ${this.config.host}:${this.config.port}: ${error.message}`;
      this.logger.error(errorMessage);

      // Provide more specific error messages
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused. Check if device is running and accessible at ${this.config.host}:${this.config.port}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Connection timeout. Device at ${this.config.host}:${this.config.port} is not responding. Check network connectivity.`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`Host not found: ${this.config.host}. Check IP address.`);
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Attempt to reconnect with retry logic
   */
  private async reconnectWithRetry(): Promise<ModbusRTU> {
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      this.logger.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}...`);
      
      try {
        return await this.getClient(true);
      } catch (error) {
        if (attempt < this.maxReconnectAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max reconnection attempts reached');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        if (this.client.isOpen) {
          this.client.close(() => {
            this.logger.log('Modbus connection closed');
          });
        }
      } catch (error) {
        this.logger.warn(`Error closing connection: ${error.message}`);
      } finally {
        this.client = null;
        this.connectionStatus.connected = false;
      }
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a connection error
      if (
        error.message?.includes('not open') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        !this.client?.isOpen
      ) {
        this.logger.warn(`${operationName} failed due to connection issue, attempting reconnect...`);
        try {
          await this.reconnectWithRetry();
          // Retry the operation once after reconnection
          return await operation();
        } catch (retryError) {
          this.logger.error(`Retry failed: ${retryError.message}`);
          throw retryError;
        }
      }
      throw error;
    }
  }

  async readHoldingRegisters(
    startAddress: number,
    quantity: number,
  ): Promise<number[]> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      const result = await client.readHoldingRegisters(startAddress, quantity);
      return result.data;
    }, 'readHoldingRegisters');
  }

  async readInputRegisters(
    startAddress: number,
    quantity: number,
  ): Promise<number[]> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      const result = await client.readInputRegisters(startAddress, quantity);
      return result.data;
    }, 'readInputRegisters');
  }

  async readCoils(startAddress: number, quantity: number): Promise<boolean[]> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      const result = await client.readCoils(startAddress, quantity);
      return result.data;
    }, 'readCoils');
  }

  async readDiscreteInputs(
    startAddress: number,
    quantity: number,
  ): Promise<boolean[]> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      const result = await client.readDiscreteInputs(startAddress, quantity);
      return result.data;
    }, 'readDiscreteInputs');
  }

  async readRegisters(
    request: ModbusReadRequest,
  ): Promise<ModbusReadResponse> {
    try {
      // Validate address range
      if (request.address < 0 || request.address > 65535) {
        throw new BadRequestException(`Address must be in range 0-65535. Got: ${request.address}`);
      }

      // Validate quantity
      if (request.quantity < 1 || request.quantity > 125) {
        throw new BadRequestException(`Quantity must be in range 1-125. Got: ${request.quantity}`);
      }

      let values: ModbusValue[] = [];

      switch (request.type) {
        case 'holding':
          const holdingData = await this.readHoldingRegisters(
            request.address,
            request.quantity,
          );
          values = holdingData.map((val, index) => ({
            address: request.address + index,
            rawValue: val,
          }));
          break;

        case 'input':
          const inputData = await this.readInputRegisters(
            request.address,
            request.quantity,
          );
          values = inputData.map((val, index) => ({
            address: request.address + index,
            rawValue: val,
          }));
          break;

        case 'coil':
          const coilData = await this.readCoils(
            request.address,
            request.quantity,
          );
          values = coilData.map((val, index) => ({
            address: request.address + index,
            rawValue: val ? 1 : 0,
          }));
          break;

        case 'discrete':
          const discreteData = await this.readDiscreteInputs(
            request.address,
            request.quantity,
          );
          values = discreteData.map((val, index) => ({
            address: request.address + index,
            rawValue: val ? 1 : 0,
          }));
          break;

        default:
          throw new BadRequestException(
            'Invalid type. Use: holding, input, coil, or discrete',
          );
      }

      return {
        success: true,
        type: request.type,
        values,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Modbus read error: ${error.message}`);
      
      // Provide more specific error messages
      if (error.message?.includes('Illegal Data Address')) {
        throw new BadRequestException(`Invalid address ${request.address} for register type ${request.type}`);
      } else if (error.message?.includes('Illegal Data Value')) {
        throw new BadRequestException(`Invalid quantity ${request.quantity} for address ${request.address}`);
      }
      
      throw error;
    }
  }

  async writeHoldingRegister(
    address: number,
    value: number,
  ): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      await client.writeRegister(address, value);
      return true;
    }, 'writeHoldingRegister');
  }

  async writeCoil(address: number, value: boolean): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      await client.writeCoil(address, value);
      return true;
    }, 'writeCoil');
  }
}
