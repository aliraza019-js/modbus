import { IsString, IsInt, Min, Max, IsOptional, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Type } from 'class-transformer';
import { IpValidator } from '../utils/ip-validator';
import { SlaveIdValidator } from '../utils/slave-id-validator';

@ValidatorConstraint({ name: 'isValidModbusIp', async: false })
export class IsValidModbusIpConstraint implements ValidatorConstraintInterface {
  validate(ip: string, args: ValidationArguments) {
    if (!ip) return true; // Optional field
    return IpValidator.isValidModbusIp(ip);
  }

  defaultMessage(args: ValidationArguments) {
    return IpValidator.getIpErrorMessage(args.value);
  }
}

@ValidatorConstraint({ name: 'isValidSlaveId', async: false })
export class IsValidSlaveIdConstraint implements ValidatorConstraintInterface {
  validate(slaveId: number, args: ValidationArguments) {
    if (slaveId === undefined || slaveId === null) return true; // Optional field
    return SlaveIdValidator.isValid(slaveId);
  }

  defaultMessage(args: ValidationArguments) {
    return SlaveIdValidator.getErrorMessage(args.value);
  }
}

export class DeviceConfigDto {
  @IsString()
  @Validate(IsValidModbusIpConstraint)
  @IsOptional()
  host?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number;

  @Type(() => Number)
  @IsInt()
  @Validate(IsValidSlaveIdConstraint)
  @IsOptional()
  slaveId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(30000)
  @IsOptional()
  timeout?: number;
}

