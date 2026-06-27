import { Body, Controller, Get, Post } from '@nestjs/common';
import { RunnerService } from './runner.service';
import { RunTestDto } from './dto/run-test.dto';

@Controller('runner')
export class RunnerController {
  constructor(private readonly runner: RunnerService) {}

  /** Démarre une campagne de mesure (suivi temps réel via WebSocket). */
  @Post('run')
  run(@Body() dto: RunTestDto) {
    return this.runner.run(dto);
  }

  /** Arrête le test en cours. */
  @Post('stop')
  stop() {
    return this.runner.stop();
  }

  /** État d'exécution courant. */
  @Get('status')
  status() {
    return this.runner.isRunning();
  }
}
