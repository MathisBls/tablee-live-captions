import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { App } from '../../interfaces';

export const REQUEST_ID_HEADER = 'x-request-id';

/** On ne reprend l'identifiant fourni par le client que s'il est court et inoffensif dans un log. */
const SAFE_REQUEST_ID = /^[\w-]{8,64}$/;

export const generateRequestId = (request: IncomingMessage): string => {
  const provided = request.headers[REQUEST_ID_HEADER];
  return typeof provided === 'string' && SAFE_REQUEST_ID.test(provided) ? provided : randomUUID();
};

export const registerRequestIdEcho = (app: App): void => {
  // Hook à callback : `await reply.header()` attendrait la fin de la réponse (le reply est thenable).
  app.addHook('onRequest', (request, reply, done) => {
    void reply.header(REQUEST_ID_HEADER, request.id);
    done();
  });
};
