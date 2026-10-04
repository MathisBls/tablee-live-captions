import { OllamaClient, WhisperClient } from './clients';
import type { AppConfig, AppContainer, ContainerOverrides, ILogger } from './interfaces';
import { InMemoryMetrics, ReadinessService } from './observability';
import { InMemorySessionRepository } from './repositories';
import {
  AppLifecycle,
  CATCH_UP_PROFILE,
  NameDetector,
  SessionService,
  TopicService,
  TranscriptAssistantService,
  TranscriptService,
  WarmupService,
} from './services';

/** Composition root : le seul endroit qui connaît les implémentations. */
export const createContainer = (
  config: AppConfig,
  logger: ILogger,
  overrides: ContainerOverrides = {},
): AppContainer => {
  const metrics = new InMemoryMetrics();
  const llm = overrides.llm ?? new OllamaClient(config.ollama, metrics);
  const transcriber = overrides.transcriber ?? new WhisperClient(config.whisper, metrics);
  const repository = new InMemorySessionRepository();

  const transcripts = new TranscriptService({
    repository,
    transcriber,
    nameDetector: new NameDetector(),
    topics: new TopicService(llm, metrics, logger),
    metrics,
    logger,
    silenceRms: config.audio.silenceRms,
  });
  const sessions = new SessionService(repository, transcripts, config.sessions, logger);

  return {
    sessions,
    transcripts,
    catchUp: new TranscriptAssistantService(CATCH_UP_PROFILE, repository, llm, logger),
    readiness: new ReadinessService({ llm, transcriber }),
    metrics,
    lifecycle: new AppLifecycle(sessions, new WarmupService(llm, transcriber), logger),
  };
};
