import { API_PATHS } from '@tablee/shared';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { AudioSocketController, EventsSocketController } from '../controllers';

/** Les paramètres sont validés dans le controller : un refus se signale par un code de fermeture WS. */
export const wsRoutes =
  (audio: AudioSocketController, events: EventsSocketController): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.route({
      method: 'GET',
      url: API_PATHS.audioSocket(':sessionId'),
      websocket: true,
      handler: audio.handle,
    });
    app.route({
      method: 'GET',
      url: API_PATHS.eventsSocket(':sessionId'),
      websocket: true,
      handler: events.handle,
    });
    done();
  };
