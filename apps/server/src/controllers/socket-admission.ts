import type { WebSocket } from '@fastify/websocket';
import { sessionParamsSchema, WS_CLOSE_CODES } from '@tablee/shared';
import type { FastifyRequest } from 'fastify';
import { isOriginAllowed } from '../http';
import type { ISessionService } from '../interfaces';

/**
 * Contrôles communs à l'ouverture d'un WebSocket : origine autorisée (le CORS ne s'applique pas
 * aux WebSockets) et session active. Ferme le socket avec le code applicatif et renvoie `null` sinon.
 */
export const admitSocket = (
  socket: WebSocket,
  request: FastifyRequest,
  sessions: ISessionService,
  allowedOrigins: readonly string[],
): string | null => {
  if (!isOriginAllowed(request.headers.origin, allowedOrigins)) {
    socket.close(WS_CLOSE_CODES.ORIGIN_FORBIDDEN, 'Origin not allowed');
    return null;
  }
  const params = sessionParamsSchema.safeParse(request.params);
  if (!params.success || !sessions.isActive(params.data.sessionId)) {
    socket.close(WS_CLOSE_CODES.SESSION_NOT_FOUND, 'Session not found');
    return null;
  }
  return params.data.sessionId;
};
