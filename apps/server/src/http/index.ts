import type { App, AppConfig, IMetrics } from '../interfaces';
import { registerTimingHooks } from './hooks/timing';
import { registerCors } from './plugins/cors';
import { registerHelmet } from './plugins/helmet';
import { registerRateLimit } from './plugins/rate-limit';
import { registerRequestIdEcho } from './plugins/request-id';

export { isOriginAllowed } from './plugins/cors';
export { LLM_ROUTE_RATE_LIMIT } from './plugins/rate-limit';
export { generateRequestId } from './plugins/request-id';
export { ok } from './responses/envelope';
export { sendServerSentEvents } from './responses/server-sent-events';

/** Plugins transverses, dans l'ordre : identifiant de requête, en-têtes de sécurité, CORS, limitation. */
export const registerHttpPlugins = async (
  app: App,
  config: AppConfig,
  metrics: IMetrics,
): Promise<void> => {
  registerRequestIdEcho(app);
  registerTimingHooks(app, metrics);
  await registerHelmet(app);
  await registerCors(app, config.corsOrigins);
  await registerRateLimit(app);
};
