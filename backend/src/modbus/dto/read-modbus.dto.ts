import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ModbusRegisterType {
  HOLDING = 'holding',
  INPUT = 'input',
  COIL = 'coil',
  DISCRETE = 'discrete',
}

export class ReadModbusDto {
  @IsEnum(ModbusRegisterType)
  @IsOptional()
  type?: ModbusRegisterType = ModbusRegisterType.HOLDING;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  address?: number = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(125)
  @IsOptional()
  quantity?: number = 1;
}

