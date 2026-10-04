import rateLimit from '@fastify/rate-limit';
import { RateLimitedError } from '../../errors';
import type { App } from '../../interfaces';

const GLOBAL_MAX_REQUESTS_PER_MINUTE = 120;

/** Gemma est la ressource la plus chère de la machine : limite plus stricte sur ses routes. */
export const LLM_ROUTE_RATE_LIMIT = { max: 10, timeWindow: '1 minute' } as const;

export const registerRateLimit = async (app: App): Promise<void> => {
  await app.register(rateLimit, {
    global: true,
    max: GLOBAL_MAX_REQUESTS_PER_MINUTE,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => new RateLimitedError(context.after),
  });
};
