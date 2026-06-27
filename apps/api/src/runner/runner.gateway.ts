import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WS_EVENTS, LiveSample, Test } from '@energie-si/shared';

/**
 * Passerelle WebSocket (Socket.IO) : diffuse en temps réel le déroulement
 * d'un test (démarrage, échantillons à 1 Hz, fin) vers le dashboard.
 */
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN?.split(',') ?? 'http://localhost:3000' },
})
export class RunnerGateway {
  @WebSocketServer()
  server!: Server;

  emitStarted(test: Test): void {
    this.server?.emit(WS_EVENTS.TEST_STARTED, test);
  }

  emitSample(sample: LiveSample): void {
    this.server?.emit(WS_EVENTS.SAMPLE, sample);
  }

  emitCompleted(test: Test): void {
    this.server?.emit(WS_EVENTS.TEST_COMPLETED, test);
  }
}
