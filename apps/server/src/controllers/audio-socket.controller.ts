import type { WebSocket } from '@fastify/websocket';
import { WS_CLOSE_CODES } from '@tablee/shared';
import type { FastifyRequest } from 'fastify';
import { take } from 'rxjs';
import type { ISessionService, ITranscriptService } from '../interfaces';
import { admitSocket } from './socket-admission';

const toBytes = (data: Buffer | ArrayBuffer | Buffer[]): Uint8Array => {
  if (Array.isArray(data)) return Buffer.concat(data);
  return data instanceof ArrayBuffer ? new Uint8Array(data) : data;
};

/**
 * `/ws/sessions/:id/audio` : trames PCM16 binaires du micro de la table. Une seule source audio par
 * session : la connexion la plus récente remplace l'ancienne (une tablette qui se reconnecte après
 * une coupure Wi-Fi ne doit pas rester bloquée par son propre socket fantôme).
 */
export class AudioSocketController {
  private readonly activeSockets = new Map<string, WebSocket>();

  constructor(
    private readonly sessions: ISessionService,
    private readonly transcripts: ITranscriptService,
    private readonly allowedOrigins: readonly string[],
  ) {}

  handle = (socket: WebSocket, request: FastifyRequest): void => {
    const sessionId = admitSocket(socket, request, this.sessions, this.allowedOrigins);
    if (sessionId === null) return;

    this.activeSockets
      .get(sessionId)
      ?.close(WS_CLOSE_CODES.TOO_MANY_CLIENTS, 'Replaced by a newer audio connection');
    this.activeSockets.set(sessionId, socket);

    const sessionEnd = this.transcripts
      .ended(sessionId)
      .pipe(take(1))
      .subscribe(() => {
        socket.close(WS_CLOSE_CODES.SESSION_ENDED, 'Session ended');
      });

    socket.on('message', (data, isBinary) => {
      if (!isBinary) {
        socket.close(WS_CLOSE_CODES.INVALID_MESSAGE, 'Audio frames must be binary PCM16');
        return;
      }
      if (!this.sessions.isActive(sessionId)) {
        socket.close(WS_CLOSE_CODES.SESSION_ENDED, 'Session ended');
        return;
      }
      this.transcripts.pushAudio(sessionId, toBytes(data));
    });

    socket.on('close', () => {
      sessionEnd.unsubscribe();
      if (this.activeSockets.get(sessionId) !== socket) return;
      this.activeSockets.delete(sessionId);
      // Le micro s'arrête : la dernière phrase part tout de suite au lieu d'attendre la reprise.
      this.transcripts.flushAudio(sessionId);
    });
  };
}
