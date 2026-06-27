import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PowerModule } from './power/power.module';
import { CollectorModule } from './collector/collector.module';
import { MachinesModule } from './machines/machines.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { TestsModule } from './tests/tests.module';
import { AnalysisModule } from './analysis/analysis.module';
import { RunnerModule } from './runner/runner.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PowerModule,
    CollectorModule,
    MachinesModule,
    ScenariosModule,
    TestsModule,
    AnalysisModule,
    RunnerModule,
    ReportingModule,
  ],
})
export class AppModule {}
