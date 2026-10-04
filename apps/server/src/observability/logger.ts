import type { FastifyServerOptions } from 'fastify';
import type { AppConfig } from '../interfaces';

/**
 * Tout champ susceptible de porter du texte de conversation est masqué : le transcript d'un repas
 * de famille ne doit jamais finir dans un fichier de log.
 */
export const REDACTED_LOG_PATHS = [
  'text',
  'transcript',
  'label',
  'content',
  'prompt',
  'messages',
  '*.text',
  '*.transcript',
  '*.label',
  '*.content',
  '*.prompt',
  '*.messages',
  '*.*.text',
  'req.body',
  'res.body',
];

export const buildLoggerOptions = (
  config: AppConfig,
): NonNullable<FastifyServerOptions['logger']> => ({
  level: config.logLevel,
  redact: { paths: REDACTED_LOG_PATHS, censor: '[redacted]' },
  ...(config.environment === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
