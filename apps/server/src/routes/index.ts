import {
  AiController,
  AudioSocketController,
  EventsSocketController,
  HealthController,
  SessionsController,
} from '../controllers';
import type { App, AppConfig, AppContainer } from '../interfaces';
import { aiRoutes } from './ai.routes';
import { healthRoutes } from './health.routes';
import { sessionsRoutes } from './sessions.routes';
import { wsRoutes } from './ws.routes';

/** Crée les controllers (de simples adaptateurs sur les services du container) et déclare les routes. */
export const registerRoutes = async (
  app: App,
  container: AppContainer,
  config: AppConfig,
): Promise<void> => {
  const { sessions, transcripts } = container;
  await app.register(healthRoutes(new HealthController(container.readiness, container.metrics)));
  await app.register(sessionsRoutes(new SessionsController(sessions)));
  await app.register(aiRoutes(new AiController(sessions, container.catchUp)));
  await app.register(
    wsRoutes(
      new AudioSocketController(sessions, transcripts, config.corsOrigins),
      new EventsSocketController(
        sessions,
        transcripts,
        config.corsOrigins,
        config.sessions.maxEventClientsPerSession,
      ),
    ),
  );
};
