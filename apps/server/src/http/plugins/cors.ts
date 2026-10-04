import cors from '@fastify/cors';
import { CorsOriginNotAllowedError } from '../../errors';
import type { App } from '../../interfaces';

/** Une requête sans en-tête Origin ne vient pas d'un navigateur (curl, healthcheck) : elle passe. */
export const isOriginAllowed = (
  origin: string | undefined,
  allowedOrigins: readonly string[],
): boolean => origin === undefined || allowedOrigins.includes(origin);

export const registerCors = async (app: App, allowedOrigins: readonly string[]): Promise<void> => {
  await app.register(cors, {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      callback(new CorsOriginNotAllowedError(), false);
    },
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['content-type', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    credentials: false,
    maxAge: 600,
  });
};
