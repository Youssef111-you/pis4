import { Controller, Get, Query } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';

@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get()
  findAll(@Query('case') studyCase?: string) {
    return studyCase ? this.scenarios.findByCase(studyCase) : this.scenarios.findAll();
  }
}
