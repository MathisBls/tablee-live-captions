import { z } from 'zod';
import { ConfigurationError } from '../errors';
import type { AppConfig } from '../interfaces';

/** En dev le front passe par le proxy Vite : l'en-tête Origin vaut l'URL de Vite, en http (local) ou https (démo LAN). */
const DEFAULT_CORS_ORIGINS = 'http://localhost:5173,https://localhost:5173';

const isExactOrigin = (value: string): boolean => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === value;
};

const originListSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(
    z
      .array(
        z.string().refine(isExactOrigin, {
          message: 'each origin must look like https://host:port (no path, no wildcard)',
        }),
      )
      .min(1),
  );

const baseUrlSchema = z
  .url({ protocol: /^https?$/ })
  .transform((value) => value.replace(/\/+$/, ''));

const positiveInt = (fallback: number): z.ZodDefault<z.ZodCoercedNumber> =>
  z.coerce.number().int().positive().default(fallback);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  CORS_ORIGINS: originListSchema.default(DEFAULT_CORS_ORIGINS.split(',')),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  OLLAMA_URL: baseUrlSchema.default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().trim().min(1).default('gemma4:e4b'),
  OLLAMA_NUM_CTX: positiveInt(8192),
  OLLAMA_KEEP_ALIVE: z
    .string()
    .trim()
    .regex(/^-?\d+[smh]?$/, 'must be an Ollama duration such as 4h, 30m or -1')
    .default('4h'),
  OLLAMA_TIMEOUT_MS: positiveInt(90_000),
  WHISPER_URL: baseUrlSchema.default('http://127.0.0.1:8080'),
  WHISPER_TIMEOUT_MS: positiveInt(15_000),
  SESSION_TTL_MINUTES: positiveInt(240),
  MAX_SESSIONS: positiveInt(5),
  MAX_EVENT_CLIENTS_PER_SESSION: positiveInt(8),
  AUDIO_SILENCE_RMS: z.coerce.number().positive().max(1).default(0.01),
});

/** Lit et valide l'environnement. Échoue au démarrage avec un message lisible si une variable est invalide. */
export const loadConfig = (environment: NodeJS.ProcessEnv): AppConfig => {
  const result = envSchema.safeParse(environment);
  if (!result.success) {
    throw new ConfigurationError(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  const env = result.data;
  return {
    environment: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS,
    logLevel: env.LOG_LEVEL,
    ollama: {
      url: env.OLLAMA_URL,
      model: env.OLLAMA_MODEL,
      numCtx: env.OLLAMA_NUM_CTX,
      keepAlive: env.OLLAMA_KEEP_ALIVE,
      timeoutMs: env.OLLAMA_TIMEOUT_MS,
    },
    whisper: { url: env.WHISPER_URL, timeoutMs: env.WHISPER_TIMEOUT_MS },
    sessions: {
      ttlMinutes: env.SESSION_TTL_MINUTES,
      maxSessions: env.MAX_SESSIONS,
      maxEventClientsPerSession: env.MAX_EVENT_CLIENTS_PER_SESSION,
    },
    audio: { silenceRms: env.AUDIO_SILENCE_RMS },
  };
};
