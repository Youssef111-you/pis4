import { Controller, Get } from '@nestjs/common';
import { PowerService } from './power.service';

@Controller('power')
export class PowerController {
  constructor(private readonly power: PowerService) {}

  /** État des backends de mesure (actif + disponibilité) — affiché dans le dashboard. */
  @Get('backends')
  async backends() {
    return {
      active: this.power.getActiveBackend(),
      backends: await this.power.describe(),
    };
  }
}
