import { Module } from '@nestjs/common';
import { RunnerService } from './runner.service';
import { RunnerController } from './runner.controller';
import { RunnerGateway } from './runner.gateway';
import { CollectorModule } from '../collector/collector.module';
import { PowerModule } from '../power/power.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [CollectorModule, PowerModule, AnalysisModule],
  controllers: [RunnerController],
  providers: [RunnerService, RunnerGateway],
})
export class RunnerModule {}
