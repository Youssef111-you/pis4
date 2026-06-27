import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Hypervisor, RunTestDto as IRunTestDto } from '@energie-si/shared';

export class RunTestDto implements IRunTestDto {
  @IsInt()
  machineId!: number;

  @IsString()
  scenarioCode!: string;

  @IsOptional()
  @IsEnum(Hypervisor)
  hypervisor?: Hypervisor;

  @IsOptional()
  @IsInt()
  @Min(0)
  vmCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationS?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  intervalMs?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
