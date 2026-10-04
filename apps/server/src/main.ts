import { buildApp } from './app';
import { loadConfig } from './config';
import { createContainer } from './container';

/** Au-delà, l'arrêt est forcé : une requête bloquée ne doit pas empêcher de relancer le serveur. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = loadConfig(process.env);
const { app, container } = await buildApp({
  config,
  createContainer: (logger) => createContainer(config, logger),
});

let shuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info({ signal }, 'Shutting down');
  const forceExit = setTimeout(() => {
    app.log.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();
  try {
    await app.close();
    process.exit(0);
  } catch (error: unknown) {
    app.log.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
};

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, (received) => {
    void shutdown(received);
  });
}

try {
  await app.listen({ host: config.host, port: config.port });
  container.lifecycle.start();
} catch (error: unknown) {
  app.log.fatal({ err: error }, 'Server failed to start');
  process.exit(1);
}
