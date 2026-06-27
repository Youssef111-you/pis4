import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { MachineType, CreateMachineDto as ICreateMachineDto } from '@energie-si/shared';

export class CreateMachineDto implements ICreateMachineDto {
  @IsString()
  name!: string;

  @IsEnum(MachineType)
  type!: MachineType;

  @IsOptional()
  @IsString()
  cpuModel?: string;

  @IsOptional()
  @IsInt()
  cpuCores?: number;

  @IsOptional()
  @IsNumber()
  ramGo?: number;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsNumber()
  pIdleW?: number;

  @IsOptional()
  @IsNumber()
  pMaxW?: number;
}
