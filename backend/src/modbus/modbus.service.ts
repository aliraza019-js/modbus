import { Injectable, OnModuleInit, OnModuleDestroy, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ModbusRTU from 'modbus-serial';
import { IpValidator } from './utils/ip-validator';
import { SlaveIdValidator } from './utils/slave-id-validator';
import { ConfigStorage } from './utils/config-storage';

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
    // Priority: 1. Saved user config (ALWAYS takes priority), 2. Environment variables, 3. Sensible defaults
    const savedConfig = ConfigStorage.loadConfig();
    
    this.logger.log('========================================');
    this.logger.log('Loading Modbus configuration...');
    this.logger.log(`Config file path: ${ConfigStorage.getConfigFilePath()}`);
    
    if (savedConfig) {
      this.logger.log(`✓ Found saved user configuration`);
      this.logger.log(`  Host: ${savedConfig.host || 'not set'}`);
      this.logger.log(`  Port: ${savedConfig.port || 'not set'}`);
      this.logger.log(`  Slave ID: ${savedConfig.slaveId || 'not set'}`);
      this.logger.log(`  Last updated: ${savedConfig.lastUpdated || 'unknown'}`);
      this.logger.log(`  Full config: ${JSON.stringify(savedConfig, null, 2)}`);
    } else {
      this.logger.log('⚠ No saved user configuration found');
      this.logger.log('  Will check environment variables...');
    }

    // Load from saved config first (ALWAYS takes priority if it exists)
    // Then fall back to env vars, then defaults
    const host = savedConfig?.host || 
                 this.configService.get<string>('MODBUS_HOST') || 
                 null;
    
    const port = savedConfig?.port || 
                 (this.configService.get<string>('MODBUS_PORT') ? 
                   parseInt(this.configService.get<string>('MODBUS_PORT'), 10) : null) || 
                 502; // Standard Modbus port as default
    
    const slaveId = savedConfig?.slaveId || 
                    (this.configService.get<string>('MODBUS_SLAVE_ID') ? 
                      parseInt(this.configService.get<string>('MODBUS_SLAVE_ID'), 10) : null) || 
                    1;
    
    const timeout = savedConfig?.timeout || 
                    (this.configService.get<string>('MODBUS_TIMEOUT') ? 
                      parseInt(this.configService.get<string>('MODBUS_TIMEOUT'), 10) : null) || 
                    5000;

    // Log source of each value
    this.logger.log('Configuration source breakdown:');
    this.logger.log(`  Host: ${host} (${savedConfig?.host ? 'from saved config' : this.configService.get<string>('MODBUS_HOST') ? 'from env var' : 'NOT SET'})`);
    this.logger.log(`  Port: ${port} (${savedConfig?.port ? 'from saved config' : this.configService.get<string>('MODBUS_PORT') ? 'from env var' : 'default'})`);
    this.logger.log(`  Slave ID: ${slaveId} (${savedConfig?.slaveId ? 'from saved config' : this.configService.get<string>('MODBUS_SLAVE_ID') ? 'from env var' : 'default'})`);
    this.logger.log(`  Timeout: ${timeout}ms (${savedConfig?.timeout ? 'from saved config' : this.configService.get<string>('MODBUS_TIMEOUT') ? 'from env var' : 'default'})`);

    // Host is required - no default
    if (!host) {
      this.logger.error('✗ No Modbus host configured. User must configure via settings.');
      throw new BadRequestException('Modbus device IP address is required. Please configure via Settings page.');
    }

    this.logger.log(`✓ Final configuration: ${host}:${port}, Slave ID: ${slaveId}, Timeout: ${timeout}ms`);
    this.logger.log('========================================');

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
    this.logger.log(`Current configuration: ${this.config.host}:${this.config.port}, Slave ID: ${this.config.slaveId}`);
    this.logger.log(`Port range: 1-65535`);
    this.logger.log(`Slave ID range: 1-255`);
    this.logger.log(`IP address: Any valid IPv4 address (no restrictions)`);
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
    
    this.logger.log(`Updating configuration from user settings...`);
    this.logger.log(`New config values: ${JSON.stringify(newConfig)}`);
    
    // Merge new config
    this.config = { ...this.config, ...newConfig };
    
    // Validate new config
    try {
      this.validateConfig();
    } catch (error) {
      // Revert on validation failure
      this.config = oldConfig;
      this.logger.error(`Configuration validation failed: ${error.message}`);
      throw error;
    }

    // Save to persistent storage (CRITICAL - this ensures settings persist across restarts)
    try {
      const configToSave = {
        host: this.config.host,
        port: this.config.port,
        slaveId: this.config.slaveId,
        timeout: this.config.timeout,
      };
      ConfigStorage.saveConfig(configToSave);
      this.logger.log(`✓ Configuration saved to file: ${ConfigStorage.getConfigFilePath()}`);
      this.logger.log(`  Saved values: ${JSON.stringify(configToSave, null, 2)}`);
      this.logger.log(`  This configuration will be used on next server restart`);
    } catch (error: any) {
      this.logger.error(`✗ CRITICAL: Failed to save configuration to file: ${error.message}`);
      this.logger.error(`  Settings will be lost on server restart!`);
      this.logger.error(`  Error details: ${error.stack}`);
      // Don't throw - config is still updated in memory for current session
    }

    // Disconnect existing connection if config changed
    if (this.client && this.client.isOpen) {
      this.logger.log('Configuration changed, disconnecting existing connection...');
      await this.disconnect();
    }

    this.connectionStatus = {
      connected: false,
      host: this.config.host,
      port: this.config.port,
      slaveId: this.config.slaveId,
    };

    this.logger.log(`✓ Configuration updated successfully: ${this.config.host}:${this.config.port}, Slave ID: ${this.config.slaveId}`);
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
    this.logger.log(`[TEST CONNECTION] Starting connection test...`);
    this.logger.log(`[TEST CONNECTION] Configuration: ${this.config.host}:${this.config.port}, Slave ID: ${this.config.slaveId}`);
    
    try {
      const client = await this.getClient(true); // Force new connection
      
      // Ensure slave ID is set (double-check)
      client.setID(this.config.slaveId);
      this.logger.log(`[TEST CONNECTION] Slave ID verified: ${this.config.slaveId}`);
      
      // Try to read a single holding register at address 0 as a test
      this.logger.log(`[TEST CONNECTION] Attempting test read from holding register 0...`);
      try {
        const readStartTime = Date.now();
        await client.readHoldingRegisters(0, 1);
        const readDuration = Date.now() - readStartTime;
        
        this.connectionStatus.connected = true;
        this.connectionStatus.lastConnected = new Date();
        this.connectionStatus.lastError = undefined;
        this.reconnectAttempts = 0;
        
        this.logger.log(`[TEST CONNECTION] ✓ SUCCESS - Read completed in ${readDuration}ms`);
        this.logger.log(`[TEST CONNECTION] Connection fully operational`);
        
        return {
          success: true,
          message: `Successfully connected to ${this.config.host}:${this.config.port} (Slave ID: ${this.config.slaveId})`,
        };
      } catch (readError: any) {
        // Connection established but read failed - might be address issue
        this.connectionStatus.connected = true;
        this.connectionStatus.lastConnected = new Date();
        this.logger.warn(`[TEST CONNECTION] Connection established but test read failed`);
        this.logger.warn(`[TEST CONNECTION] Read error: ${readError.message}`);
        this.logger.warn(`[TEST CONNECTION] This might indicate invalid register address, but connection is working`);
        return {
          success: true,
          message: `Connected to device but test read failed (address might be invalid): ${readError.message}`,
        };
      }
    } catch (error: any) {
      this.connectionStatus.connected = false;
      this.connectionStatus.lastError = error.message;
      this.logger.error(`[TEST CONNECTION] ✗ FAILED`);
      this.logger.error(`[TEST CONNECTION] Error: ${error.message}`);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  private async getClient(forceReconnect = false): Promise<ModbusRTU> {
    // Check if we have a valid connection
    if (!forceReconnect && this.client && this.client.isOpen) {
      this.logger.debug(`Using existing connection to ${this.config.host}:${this.config.port}`);
      return this.client;
    }

    // Close existing connection if forcing reconnect
    if (forceReconnect && this.client) {
      this.logger.log(`Force reconnect requested, closing existing connection...`);
      await this.disconnect();
    }

    // Create new client
    this.client = new ModbusRTU();

    try {
      this.logger.log(`[CONNECTION ATTEMPT] Starting connection to Modbus TCP device...`);
      this.logger.log(`[CONNECTION ATTEMPT] Target: ${this.config.host}:${this.config.port}`);
      this.logger.log(`[CONNECTION ATTEMPT] Slave ID: ${this.config.slaveId}`);
      this.logger.log(`[CONNECTION ATTEMPT] Timeout: ${this.config.timeout}ms`);
      
      // Set timeout BEFORE connecting (important for slow devices)
      this.client.setTimeout(this.config.timeout);
      this.logger.debug(`Timeout set to ${this.config.timeout}ms`);
      
      const connectStartTime = Date.now();
      this.logger.log(`[CONNECTION ATTEMPT] Initiating TCP connection...`);
      
      await this.client.connectTCP(this.config.host, {
        port: this.config.port,
      });

      const connectDuration = Date.now() - connectStartTime;
      this.logger.log(`[CONNECTION SUCCESS] TCP socket connected in ${connectDuration}ms`);

      // Set slave ID immediately after connection (critical for Modbus TCP)
      this.client.setID(this.config.slaveId);
      this.logger.debug(`Slave ID set to ${this.config.slaveId}`);

      // Small delay to ensure connection is fully established (some devices need this)
      await new Promise(resolve => setTimeout(resolve, 100));

      this.connectionStatus.connected = true;
      this.connectionStatus.lastConnected = new Date();
      this.connectionStatus.lastError = undefined;
      this.reconnectAttempts = 0;

      this.logger.log(
        `[CONNECTION SUCCESS] ✓ Fully connected to Modbus TCP device at ${this.config.host}:${this.config.port} (Slave ID: ${this.config.slaveId})`,
      );

      return this.client;
    } catch (error: any) {
      this.client = null;
      this.connectionStatus.connected = false;
      this.connectionStatus.lastError = error.message;
      this.reconnectAttempts++;

      // Detailed error logging
      this.logger.error(`[CONNECTION FAILED] Connection attempt failed`);
      this.logger.error(`[CONNECTION FAILED] Target: ${this.config.host}:${this.config.port}`);
      this.logger.error(`[CONNECTION FAILED] Slave ID: ${this.config.slaveId}`);
      this.logger.error(`[CONNECTION FAILED] Error code: ${error.code || 'N/A'}`);
      this.logger.error(`[CONNECTION FAILED] Error message: ${error.message}`);
      this.logger.error(`[CONNECTION FAILED] Error stack: ${error.stack || 'N/A'}`);
      this.logger.error(`[CONNECTION FAILED] Reconnect attempt: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      const errorMessage = `Failed to connect to Modbus device at ${this.config.host}:${this.config.port}: ${error.message}`;

      // Provide more specific error messages with root cause analysis
      if (error.code === 'ECONNREFUSED') {
        const detailedError = `[ROOT CAUSE] Connection refused by device at ${this.config.host}:${this.config.port}. Possible reasons:
1. Device is not powered on or not accessible
2. Wrong IP address: ${this.config.host}
3. Wrong port: ${this.config.port}
4. Firewall blocking connection
5. Device is not configured for Modbus TCP on this port`;
        this.logger.error(detailedError);
        throw new Error(detailedError);
      } else if (error.code === 'ETIMEDOUT') {
        const detailedError = `[ROOT CAUSE] Connection timeout after ${this.config.timeout}ms. Possible reasons:
1. Device is not responding (check if device is online)
2. Network connectivity issues
3. Wrong IP address: ${this.config.host}
4. Device firewall blocking connection
5. Device is busy or overloaded`;
        this.logger.error(detailedError);
        throw new Error(detailedError);
      } else if (error.code === 'ENOTFOUND') {
        const detailedError = `[ROOT CAUSE] Host not found: ${this.config.host}. Possible reasons:
1. Invalid IP address format
2. DNS resolution failed (if using hostname)
3. Network configuration issue`;
        this.logger.error(detailedError);
        throw new Error(detailedError);
      } else if (error.code === 'EHOSTUNREACH') {
        const detailedError = `[ROOT CAUSE] Host unreachable: ${this.config.host}. Possible reasons:
1. Device is not on the same network
2. Routing issue
3. Network interface down`;
        this.logger.error(detailedError);
        throw new Error(detailedError);
      }

      this.logger.error(`[CONNECTION FAILED] Unknown error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Attempt to reconnect with retry logic
   */
  private async reconnectWithRetry(): Promise<ModbusRTU> {
    this.logger.log(`[RECONNECT] Starting reconnection with retry logic...`);
    this.logger.log(`[RECONNECT] Max attempts: ${this.maxReconnectAttempts}, Delay: ${this.reconnectDelay}ms`);
    
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      this.logger.log(`[RECONNECT] Attempt ${attempt}/${this.maxReconnectAttempts}...`);
      
      try {
        const client = await this.getClient(true);
        this.logger.log(`[RECONNECT] ✓ Successfully reconnected on attempt ${attempt}`);
        return client;
      } catch (error: any) {
        this.logger.error(`[RECONNECT] Attempt ${attempt} failed: ${error.message}`);
        if (attempt < this.maxReconnectAttempts) {
          this.logger.log(`[RECONNECT] Waiting ${this.reconnectDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        } else {
          this.logger.error(`[RECONNECT] ✗ All ${this.maxReconnectAttempts} reconnection attempts failed`);
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
      // Ensure slave ID is set before each operation (some devices require this)
      client.setID(this.config.slaveId);
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
      // Ensure slave ID is set before each operation
      client.setID(this.config.slaveId);
      const result = await client.readInputRegisters(startAddress, quantity);
      return result.data;
    }, 'readInputRegisters');
  }

  async readCoils(startAddress: number, quantity: number): Promise<boolean[]> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      // Ensure slave ID is set before each operation
      client.setID(this.config.slaveId);
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
      // Ensure slave ID is set before each operation
      client.setID(this.config.slaveId);
      const result = await client.readDiscreteInputs(startAddress, quantity);
      return result.data;
    }, 'readDiscreteInputs');
  }

  async readRegisters(
    request: ModbusReadRequest,
  ): Promise<ModbusReadResponse> {
    this.logger.log(`[READ] Starting read operation: type=${request.type}, address=${request.address}, quantity=${request.quantity}`);
    
    try {
      // Validate address range
      if (request.address < 0 || request.address > 65535) {
        this.logger.error(`[READ] Invalid address: ${request.address} (must be 0-65535)`);
        throw new BadRequestException(`Address must be in range 0-65535. Got: ${request.address}`);
      }

      // Validate quantity
      if (request.quantity < 1 || request.quantity > 125) {
        this.logger.error(`[READ] Invalid quantity: ${request.quantity} (must be 1-125)`);
        throw new BadRequestException(`Quantity must be in range 1-125. Got: ${request.quantity}`);
      }

      let values: ModbusValue[] = [];
      const readStartTime = Date.now();

      switch (request.type) {
        case 'holding':
          this.logger.log(`[READ] Reading holding registers from address ${request.address}, quantity ${request.quantity}`);
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
          this.logger.log(`[READ] Reading input registers from address ${request.address}, quantity ${request.quantity}`);
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
          this.logger.log(`[READ] Reading coils from address ${request.address}, quantity ${request.quantity}`);
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
          this.logger.log(`[READ] Reading discrete inputs from address ${request.address}, quantity ${request.quantity}`);
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
          this.logger.error(`[READ] Invalid register type: ${request.type}`);
          throw new BadRequestException(
            'Invalid type. Use: holding, input, coil, or discrete',
          );
      }

      const readDuration = Date.now() - readStartTime;
      this.logger.log(`[READ] ✓ Successfully read ${values.length} values in ${readDuration}ms`);

      return {
        success: true,
        type: request.type,
        values,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`[READ] ✗ Read operation failed`);
      this.logger.error(`[READ] Type: ${request.type}, Address: ${request.address}, Quantity: ${request.quantity}`);
      this.logger.error(`[READ] Error: ${error.message}`);
      this.logger.error(`[READ] Error stack: ${error.stack || 'N/A'}`);
      
      // Provide more specific error messages
      if (error.message?.includes('Illegal Data Address')) {
        this.logger.error(`[READ] Root cause: Invalid address ${request.address} for register type ${request.type}`);
        throw new BadRequestException(`Invalid address ${request.address} for register type ${request.type}`);
      } else if (error.message?.includes('Illegal Data Value')) {
        this.logger.error(`[READ] Root cause: Invalid quantity ${request.quantity} for address ${request.address}`);
        throw new BadRequestException(`Invalid quantity ${request.quantity} for address ${request.address}`);
      } else if (error.message?.includes('not open') || error.message?.includes('ECONNREFUSED')) {
        this.logger.error(`[READ] Root cause: Connection issue - device may be unreachable`);
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
      // Ensure slave ID is set before each operation
      client.setID(this.config.slaveId);
      await client.writeRegister(address, value);
      return true;
    }, 'writeHoldingRegister');
  }

  async writeCoil(address: number, value: boolean): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const client = await this.getClient();
      // Ensure slave ID is set before each operation
      client.setID(this.config.slaveId);
      await client.writeCoil(address, value);
      return true;
    }, 'writeCoil');
  }
}
