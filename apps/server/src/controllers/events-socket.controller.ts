import type { WebSocket } from '@fastify/websocket';
import { WS_CLOSE_CODES } from '@tablee/shared';
import type { FastifyRequest } from 'fastify';
import type { ISessionService, ITranscriptService } from '../interfaces';
import { admitSocket } from './socket-admission';

const INTERNAL_ERROR_CLOSE_CODE = 1011;

/**
 * `/ws/sessions/:id/events` : pousse les `ServerEvent` JSON aux écrans de la session. Le premier
 * message est toujours un `snapshot`, ce qui rend une reconnexion transparente pour le client.
 */
export class EventsSocketController {
  private readonly clientCounts = new Map<string, number>();

  constructor(
    private readonly sessions: ISessionService,
    private readonly transcripts: ITranscriptService,
    private readonly allowedOrigins: readonly string[],
    private readonly maxClientsPerSession: number,
  ) {}

  handle = (socket: WebSocket, request: FastifyRequest): void => {
    const sessionId = admitSocket(socket, request, this.sessions, this.allowedOrigins);
    if (sessionId === null) return;

    const clients = this.clientCounts.get(sessionId) ?? 0;
    if (clients >= this.maxClientsPerSession) {
      socket.close(WS_CLOSE_CODES.TOO_MANY_CLIENTS, 'Too many screens for this session');
      return;
    }
    this.clientCounts.set(sessionId, clients + 1);

    const subscription = this.transcripts.events(sessionId).subscribe({
      next: (event) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(event));
      },
      complete: () => {
        socket.close(WS_CLOSE_CODES.SESSION_ENDED, 'Session ended');
      },
      error: (error: unknown) => {
        request.log.error({ err: error, sessionId }, 'Event stream failed');
        socket.close(INTERNAL_ERROR_CLOSE_CODE, 'Internal error');
      },
    });

    socket.on('close', () => {
      subscription.unsubscribe();
      this.releaseClient(sessionId);
    });
  };

  private releaseClient(sessionId: string): void {
    const remaining = (this.clientCounts.get(sessionId) ?? 1) - 1;
    if (remaining <= 0) {
      this.clientCounts.delete(sessionId);
    } else {
      this.clientCounts.set(sessionId, remaining);
    }
  }
}
