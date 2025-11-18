import { IsInt, Min, Max } from 'class-validator';

export class WriteRegisterDto {
  @IsInt()
  @Min(0)
  address: number;

  @IsInt()
  @Min(0)
  @Max(65535)
  value: number;
}

