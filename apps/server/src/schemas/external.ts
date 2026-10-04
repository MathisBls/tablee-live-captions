import { z } from 'zod';

/** Une ligne NDJSON de `POST /api/chat` (Ollama) en streaming. */
export const ollamaChatLineSchema = z.object({
  message: z.object({ content: z.string() }).optional(),
  done: z.boolean().default(false),
  error: z.string().optional(),
});

/** `GET /api/tags` (Ollama) : les modèles disponibles localement. */
export const ollamaTagsSchema = z.object({
  models: z.array(z.object({ name: z.string() })),
});

/** `POST /inference` (whisper.cpp server) avec `response_format=json`. */
export const whisperInferenceSchema = z.object({ text: z.string() });
