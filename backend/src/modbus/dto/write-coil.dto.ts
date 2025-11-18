import { IsInt, IsBoolean, Min } from 'class-validator';

export class WriteCoilDto {
  @IsInt()
  @Min(0)
  address: number;

  @IsBoolean()
  value: boolean;
}

