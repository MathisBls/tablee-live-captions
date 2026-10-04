import { PassThrough } from 'node:stream';
import type { AiStreamEvent } from '@tablee/shared';
import type { FastifyReply } from 'fastify';
import type { Observable } from 'rxjs';

const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
  // Désactive la mise en tampon des proxys (nginx) : chaque token doit partir tout de suite.
  'x-accel-buffering': 'no',
} as const;

const INTERNAL_ERROR_EVENT: AiStreamEvent = {
  type: 'error',
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
};

const toServerSentEvent = (event: AiStreamEvent): string => `data: ${JSON.stringify(event)}\n\n`;

/**
 * Pousse un flux d'événements IA en `text/event-stream`. Si le client coupe la connexion, Fastify
 * détruit le flux, ce qui désabonne l'Observable et annule la requête Gemma en cours.
 */
export const sendServerSentEvents = async (
  reply: FastifyReply,
  events: Observable<AiStreamEvent>,
): Promise<void> => {
  const stream = new PassThrough();
  const subscription = events.subscribe({
    next: (event) => {
      stream.write(toServerSentEvent(event));
    },
    error: () => {
      stream.end(toServerSentEvent(INTERNAL_ERROR_EVENT));
    },
    complete: () => {
      stream.end();
    },
  });
  stream.on('close', () => {
    subscription.unsubscribe();
  });
  await reply.code(200).headers(SSE_HEADERS).send(stream);
};
