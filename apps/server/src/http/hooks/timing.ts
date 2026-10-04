import type { App, IMetrics } from '../../interfaces';

/** Une ligne de log par requête terminée, avec la route (motif, pas l'URL brute) et sa durée. */
export const registerTimingHooks = (app: App, metrics: IMetrics): void => {
  app.addHook('onResponse', async (request, reply) => {
    const durationMs = Math.round(reply.elapsedTime);
    metrics.observe('http.request_ms', durationMs);
    request.log.info(
      {
        method: request.method,
        route: request.routeOptions.url ?? 'unmatched',
        statusCode: reply.statusCode,
        durationMs,
      },
      'request completed',
    );
  });
};
