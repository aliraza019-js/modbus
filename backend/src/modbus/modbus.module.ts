import { Module } from '@nestjs/common';
import { ModbusService } from '@/modbus/modbus.service';
import { ModbusController } from '@/modbus/modbus.controller';

@Module({
  controllers: [ModbusController],
  providers: [ModbusService],
  exports: [ModbusService],
})
export class ModbusModule {}

