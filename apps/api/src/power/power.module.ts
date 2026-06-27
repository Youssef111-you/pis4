import { Module } from '@nestjs/common';
import { PowerService } from './power.service';
import { RaplBackend } from './rapl.backend';
import { BatteryBackend } from './battery.backend';
import { ModelBackend } from './model.backend';
import { PowerController } from './power.controller';

@Module({
  controllers: [PowerController],
  providers: [PowerService, RaplBackend, BatteryBackend, ModelBackend],
  exports: [PowerService],
})
export class PowerModule {}
