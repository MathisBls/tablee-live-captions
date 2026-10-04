import { z } from 'zod';
import {
  captionSegmentSchema,
  mentionAlertSchema,
  pipelineStatusSchema,
  topicUpdateSchema,
} from './captions';

/*
 * Événements poussés par le serveur sur /ws/sessions/:id/events (messages texte JSON).
 * Le premier message après connexion est toujours un `snapshot`, ce qui rend la reconnexion
 * transparente pour le client.
 */
export const snapshotEventSchema = z.object({
  type: z.literal('snapshot'),
  segments: z.array(captionSegmentSchema),
  topic: topicUpdateSchema.nullable(),
});

export const captionEventSchema = z.object({
  type: z.literal('caption'),
  segment: captionSegmentSchema,
});

export const topicEventSchema = z.object({
  type: z.literal('topic'),
  topic: topicUpdateSchema,
});

export const mentionEventSchema = z.object({
  type: z.literal('mention'),
  mention: mentionAlertSchema,
});

export const statusEventSchema = z.object({
  type: z.literal('status'),
  status: pipelineStatusSchema,
});

export const serverEventSchema = z.discriminatedUnion('type', [
  snapshotEventSchema,
  captionEventSchema,
  topicEventSchema,
  mentionEventSchema,
  statusEventSchema,
]);
export type ServerEvent = z.infer<typeof serverEventSchema>;
