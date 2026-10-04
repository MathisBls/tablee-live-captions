import type { IDependencyProbe, ILlmClient } from './clients/llm-client';
import type { ITranscriber } from './clients/transcriber';
import type { AppConfig } from './config/app-config';
import type { ILogger } from './observability/logger';
import type { IMetrics } from './observability/metrics';
import type {
  IAssistantService,
  IReadinessService,
  ISessionService,
  ITranscriptService,
} from './services/services';

export interface IAppLifecycle {
  /** Démarre les tâches de fond (purge des sessions expirées, préchauffage des modèles). */
  start(): void;
  /** Arrête tout : pipelines, requêtes Ollama et whisper en cours, minuteries. */
  shutdown(): void;
}

/**
 * Ce dont la couche HTTP a besoin. Les controllers sont de simples adaptateurs : ils sont créés
 * à l'enregistrement des routes à partir de ces services.
 */
export interface AppContainer {
  readonly sessions: ISessionService;
  readonly transcripts: ITranscriptService;
  readonly catchUp: IAssistantService;
  readonly readiness: IReadinessService;
  readonly metrics: IMetrics;
  readonly lifecycle: IAppLifecycle;
}

export interface BuildAppOptions {
  readonly config: AppConfig;
  readonly createContainer: (logger: ILogger) => AppContainer;
}

/** Points d'injection pour les tests : de faux clients IA à la place d'Ollama et de whisper. */
export interface ContainerOverrides {
  readonly llm?: ILlmClient & IDependencyProbe;
  readonly transcriber?: ITranscriber & IDependencyProbe;
}
