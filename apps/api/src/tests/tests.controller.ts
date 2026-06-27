import { Controller, Delete, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TestsService } from './tests.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly tests: TestsService) {}

  @Get()
  findAll(
    @Query('machineId') machineId?: string,
    @Query('scenarioId') scenarioId?: string,
  ) {
    return this.tests.findAll({
      machineId: machineId ? Number(machineId) : undefined,
      scenarioId: scenarioId ? Number(scenarioId) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tests.findOne(id);
  }

  @Get(':id/measurements')
  measurements(@Param('id', ParseIntPipe) id: number) {
    return this.tests.measurements(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tests.remove(id);
  }
}
