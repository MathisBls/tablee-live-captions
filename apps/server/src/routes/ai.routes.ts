import { API_PATHS, sessionParamsSchema } from '@tablee/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { AiController } from '../controllers';
import { LLM_ROUTE_RATE_LIMIT } from '../http';

export const aiRoutes =
  (controller: AiController): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.route({
      method: 'POST',
      url: API_PATHS.catchUp(':sessionId'),
      schema: { params: sessionParamsSchema },
      config: { rateLimit: LLM_ROUTE_RATE_LIMIT },
      handler: controller.catchUp,
    });
    done();
  };
