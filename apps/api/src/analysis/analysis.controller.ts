import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Get('summary')
  summary() {
    return this.analysis.summary();
  }

  @Get('hypotheses')
  hypotheses() {
    return this.analysis.hypotheses();
  }

  @Get('compare/hardware')
  compareHardware() {
    return this.analysis.compareHardware();
  }

  @Get('compare/hypervisors')
  compareHypervisors() {
    return this.analysis.compareHypervisors();
  }

  @Get('vm-scaling')
  vmScaling() {
    return this.analysis.powerByVmCount();
  }

  @Get('timeseries/:testId')
  timeseries(@Param('testId', ParseIntPipe) testId: number) {
    return this.analysis.timeseries(testId);
  }
}
