import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'SESSION_NOT_FOUND',
  'TOO_MANY_SESSIONS',
  'LLM_UNAVAILABLE',
  'TRANSCRIBER_UNAVAILABLE',
  'RATE_LIMITED',
  'CORS_ORIGIN_NOT_ALLOWED',
  'ROUTE_NOT_FOUND',
  'INTERNAL_ERROR',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

/** Enveloppe d'erreur de toutes les routes REST. Jamais de stack ni de message interne. */
export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/** Enveloppe de succès de toutes les routes REST : `{ data: T }`. */
export const dataResponseSchema = <TSchema extends z.ZodType>(
  schema: TSchema,
): z.ZodObject<{ data: TSchema }> => z.object({ data: schema });

/** GET /health : le process répond. */
export const healthDtoSchema = z.object({ status: z.literal('ok') });
export type HealthDto = z.infer<typeof healthDtoSchema>;

export const dependencyStateSchema = z.enum(['up', 'down']);
export type DependencyState = z.infer<typeof dependencyStateSchema>;

/** GET /ready : 200 si tout est `up`, 503 sinon, même corps `{ data }` dans les deux cas. */
export const readinessDtoSchema = z.object({
  ready: z.boolean(),
  dependencies: z.object({
    llm: dependencyStateSchema,
    transcriber: dependencyStateSchema,
  }),
});
export type ReadinessDto = z.infer<typeof readinessDtoSchema>;
