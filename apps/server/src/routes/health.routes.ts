import { API_PATHS, dataResponseSchema, healthDtoSchema, readinessDtoSchema } from '@tablee/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { HealthController } from '../controllers';

const METRICS_PATH = '/metrics';

export const healthRoutes =
  (controller: HealthController): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.route({
      method: 'GET',
      url: API_PATHS.health,
      schema: { response: { 200: dataResponseSchema(healthDtoSchema) } },
      handler: controller.health,
    });
    app.route({
      method: 'GET',
      url: API_PATHS.ready,
      schema: {
        response: {
          200: dataResponseSchema(readinessDtoSchema),
          503: dataResponseSchema(readinessDtoSchema),
        },
      },
      handler: controller.ready,
    });
    app.route({ method: 'GET', url: METRICS_PATH, handler: controller.snapshotMetrics });
    done();
  };
