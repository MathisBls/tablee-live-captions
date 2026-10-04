import { z } from 'zod';
import { apiErrorCodeSchema } from './api';

/*
 * Réponses streamées de Gemma (POST /api/sessions/:id/catch-up et /laugh).
 * Transport : `text/event-stream`, un événement par bloc `data: <json>\n\n`, sans champ `event:`.
 * Le flux se termine toujours par `done`, `insufficient_context` ou `error`.
 */
export const aiTokenEventSchema = z.object({
  type: z.literal('token'),
  text: z.string(),
});

/** Pas assez de conversation pour répondre : le client affiche un message localisé, Gemma n'est pas appelé. */
export const aiInsufficientContextEventSchema = z.object({
  type: z.literal('insufficient_context'),
});

export const aiDoneEventSchema = z.object({
  type: z.literal('done'),
});

export const aiErrorEventSchema = z.object({
  type: z.literal('error'),
  code: apiErrorCodeSchema,
  message: z.string(),
});

export const aiStreamEventSchema = z.discriminatedUnion('type', [
  aiTokenEventSchema,
  aiInsufficientContextEventSchema,
  aiDoneEventSchema,
  aiErrorEventSchema,
]);
export type AiStreamEvent = z.infer<typeof aiStreamEventSchema>;
