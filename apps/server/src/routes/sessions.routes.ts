import {
  API_PATHS,
  dataResponseSchema,
  sessionDtoSchema,
  sessionParamsSchema,
  sessionSettingsSchema,
} from '@tablee/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { SessionsController } from '../controllers';

const SESSION_URL = API_PATHS.session(':sessionId');

export const sessionsRoutes =
  (controller: SessionsController): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.route({
      method: 'POST',
      url: API_PATHS.sessions,
      schema: {
        body: sessionSettingsSchema,
        response: { 201: dataResponseSchema(sessionDtoSchema) },
      },
      handler: controller.create,
    });
    app.route({
      method: 'GET',
      url: SESSION_URL,
      schema: {
        params: sessionParamsSchema,
        response: { 200: dataResponseSchema(sessionDtoSchema) },
      },
      handler: controller.get,
    });
    app.route({
      method: 'DELETE',
      url: SESSION_URL,
      schema: { params: sessionParamsSchema },
      handler: controller.end,
    });
    done();
  };
