import { Controller, Get } from '@nestjs/common';
import { CollectorService } from './collector.service';

@Controller('collector')
export class CollectorController {
  constructor(private readonly collector: CollectorService) {}

  /** Échantillon instantané (CPU, RAM, température). */
  @Get('sample')
  sample() {
    return this.collector.sample();
  }

  /** Caractéristiques détectées de la machine hôte. */
  @Get('specs')
  specs() {
    return this.collector.detectSpecs();
  }
}
