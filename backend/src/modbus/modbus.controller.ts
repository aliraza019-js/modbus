import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ModbusService } from './modbus.service';
import { ReadModbusDto, ModbusRegisterType } from './dto/read-modbus.dto';
import { WriteRegisterDto } from './dto/write-register.dto';
import { WriteCoilDto } from './dto/write-coil.dto';
import { DeviceConfigDto } from './dto/device-config.dto';

@Controller('modbus')
export class ModbusController {
  constructor(private readonly modbusService: ModbusService) {}

  @Get('read')
  async readRegisters(@Query() query: ReadModbusDto) {
    try {
      const result = await this.modbusService.readRegisters({
        type: query.type || ModbusRegisterType.HOLDING,
        address: query.address ?? 0,
        quantity: query.quantity ?? 1,
      });
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to read Modbus data',
          details: error.toString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  async getConnectionStatus() {
    try {
      const status = this.modbusService.getConnectionStatus();
      return {
        success: true,
        ...status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to get connection status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('config')
  async getConfig() {
    try {
      const config = this.modbusService.getConfig();
      return {
        success: true,
        config: {
          host: config.host,
          port: config.port,
          slaveId: config.slaveId,
          timeout: config.timeout,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to get configuration',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('config')
  async updateConfig(@Body() body: DeviceConfigDto) {
    try {
      await this.modbusService.updateConfig(body);
      return {
        success: true,
        message: 'Configuration updated successfully',
        config: this.modbusService.getConfig(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to update configuration',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('test-connection')
  async testConnection() {
    try {
      const result = await this.modbusService.testConnection();
      return {
        success: result.success,
        message: result.message,
        status: this.modbusService.getConnectionStatus(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Connection test failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('write/register')
  async writeRegister(
    @Body() body: WriteRegisterDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.modbusService.writeHoldingRegister(body.address, body.value);
      return {
        success: true,
        message: `Successfully wrote value ${body.value} to register ${body.address}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to write Modbus register',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('write/coil')
  async writeCoil(
    @Body() body: WriteCoilDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.modbusService.writeCoil(body.address, body.value);
      return {
        success: true,
        message: `Successfully wrote value ${body.value} to coil ${body.address}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to write Modbus coil',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
