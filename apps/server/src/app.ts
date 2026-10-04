import websocket from '@fastify/websocket';
import { AUDIO_MAX_MESSAGE_BYTES } from '@tablee/shared';
import Fastify, { LogController } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { registerErrorHandlers } from './errors';
import { generateRequestId, registerHttpPlugins } from './http';
import type { App, AppContainer, BuildAppOptions } from './interfaces';
import { buildLoggerOptions } from './observability';
import { registerRoutes } from './routes';

/** Les corps REST sont de petits JSON (réglages de session) : tout le reste est refusé. */
const REST_BODY_LIMIT_BYTES = 16 * 1024;

export const buildApp = async ({
  config,
  createContainer,
}: BuildAppOptions): Promise<{ app: App; container: AppContainer }> => {
  const app = Fastify({
    logger: buildLoggerOptions(config),
    genReqId: generateRequestId,
    requestIdHeader: false,
    // Les lignes de requête sont produites par le hook de timing (route, statut, durée).
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: REST_BODY_LIMIT_BYTES,
    // À l'arrêt, les flux SSE en cours sont coupés : leur désabonnement annule les requêtes Gemma.
    forceCloseConnections: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandlers(app);

  const container = createContainer(app.log);
  await registerHttpPlugins(app, config, container.metrics);
  await app.register(websocket, { options: { maxPayload: AUDIO_MAX_MESSAGE_BYTES } });
  await registerRoutes(app, container, config);

  app.addHook('onClose', (_instance, done) => {
    container.lifecycle.shutdown();
    done();
  });

  return { app, container };
};
