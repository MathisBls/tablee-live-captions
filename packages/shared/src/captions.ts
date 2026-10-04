import { z } from 'zod';

const epochMsSchema = z.number().int().nonnegative();

/** Un morceau de conversation transcrit par Whisper (une fenêtre audio de quelques secondes). */
export const captionSegmentSchema = z.object({
  id: z.uuid(),
  text: z.string().min(1),
  startedAt: epochMsSchema,
  endedAt: epochMsSchema,
});
export type CaptionSegment = z.infer<typeof captionSegmentSchema>;

/** Plage de caractères [start, end[ dans `CaptionSegment.text`. */
export const textRangeSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
  })
  .refine((range) => range.end > range.start, { message: 'end must be greater than start' });
export type TextRange = z.infer<typeof textRangeSchema>;

/** Le prénom ou un surnom de la personne a été prononcé dans un segment. */
export const mentionAlertSchema = z.object({
  segmentId: z.uuid(),
  /** Le prénom ou surnom configuré qui a été reconnu (forme de référence, pas la forme entendue). */
  matchedName: z.string().min(1),
  /** Où surligner dans le texte du segment. */
  ranges: z.array(textRangeSchema).min(1),
  at: epochMsSchema,
});
export type MentionAlert = z.infer<typeof mentionAlertSchema>;

/** Sujet de conversation en cours résumé par Gemma (3 à 6 mots). */
export const topicUpdateSchema = z.object({
  label: z.string().min(1).max(80),
  at: epochMsSchema,
});
export type TopicUpdate = z.infer<typeof topicUpdateSchema>;

export const pipelineComponentSchema = z.enum(['transcriber', 'llm']);
export type PipelineComponent = z.infer<typeof pipelineComponentSchema>;

export const pipelineStateSchema = z.enum(['ok', 'degraded']);
export type PipelineState = z.infer<typeof pipelineStateSchema>;

/** Santé du pipeline côté serveur, poussée aux clients pour un affichage dégradé lisible. */
export const pipelineStatusSchema = z.object({
  component: pipelineComponentSchema,
  state: pipelineStateSchema,
  at: epochMsSchema,
});
export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;
