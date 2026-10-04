import type {
  AiStreamEvent,
  CaptionSegment,
  ReadinessDto,
  ServerEvent,
  SessionSettings,
} from '@tablee/shared';
import type { Observable } from 'rxjs';
import type { LlmMessage } from '../clients/llm-client';
import type { ITranscriber } from '../clients/transcriber';
import type { ILogger } from '../observability/logger';
import type { IMetrics } from '../observability/metrics';
import type { ISessionRepository } from '../repositories/session-repository';
import type { NameDetectionSettings, NameMatch, TableSession } from '../models/table-session';

export interface ISessionService {
  /** Crée la session et démarre son pipeline audio. */
  create(settings: SessionSettings): TableSession;
  /** Lève SessionNotFoundError si la session n'existe pas (ou plus). */
  get(sessionId: string): TableSession;
  isActive(sessionId: string): boolean;
  /** Termine la session : pipeline arrêté, sockets fermés, transcript purgé. */
  end(sessionId: string): void;
  purgeExpired(now: number): void;
  endAll(): void;
}

/** Pipeline temps réel d'une session : audio → sous-titres, sujet, alertes. */
export interface ITranscriptService {
  start(session: TableSession): void;
  stop(sessionId: string): void;
  pushAudio(sessionId: string, bytes: Uint8Array): void;
  flushAudio(sessionId: string): void;
  /** Commence par un `snapshot`, puis les événements en direct ; se termine quand la session s'arrête. */
  events(sessionId: string): Observable<ServerEvent>;
  /** Émet une fois puis se termine quand la session s'arrête. */
  ended(sessionId: string): Observable<void>;
}

export interface INameDetector {
  detect(text: string, settings: NameDetectionSettings): readonly NameMatch[];
}

export type TopicWatchEvent = Extract<ServerEvent, { type: 'topic' | 'status' }>;

export interface ITopicService {
  watch(
    segments: Observable<CaptionSegment>,
    settings: SessionSettings,
  ): Observable<TopicWatchEvent>;
}

/** Réponse ponctuelle de Gemma sur le transcript récent (« Qu'est-ce que j'ai raté ? », « Pourquoi ça rit ? »). */
export interface IAssistantService {
  respond(sessionId: string): Observable<AiStreamEvent>;
}

export interface IReadinessService {
  check(): Promise<ReadinessDto>;
}

export interface WarmupReport {
  readonly component: 'llm' | 'transcriber';
  readonly durationMs: number;
  readonly succeeded: boolean;
}

/** Charge les modèles en mémoire au démarrage pour que le premier convive n'attende pas. */
export interface IWarmupService {
  warmUp(): Observable<WarmupReport>;
}

export type TopicOutcome =
  | { readonly kind: 'topic'; readonly label: string }
  /** Gemma a répondu, mais rien d'utilisable : on garde l'ancien sujet. */
  | { readonly kind: 'unusable' }
  | { readonly kind: 'failed' };

export interface TopicServiceOptions {
  /** Fenêtre de conversation donnée à Gemma. */
  readonly contextMs: number;
  /** Pas de sujet tant que la conversation n'a pas au moins ce nombre de mots. */
  readonly minWords: number;
  /** Au plus une requête par période, et seulement si la conversation a avancé. */
  readonly refreshMs: number;
}

export interface AssistantProfile {
  /** Nom technique, pour les logs. */
  readonly name: string;
  readonly lookbackMs: number;
  /** Sous ce nombre de mots, Gemma n'est pas appelé : `insufficient_context`. */
  readonly minWords: number;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly buildPrompt: (
    segments: readonly CaptionSegment[],
    settings: SessionSettings,
  ) => LlmMessage[];
}

export interface TranscriptServiceDependencies {
  readonly repository: ISessionRepository;
  readonly transcriber: ITranscriber;
  readonly nameDetector: INameDetector;
  readonly topics: ITopicService;
  readonly metrics: IMetrics;
  readonly logger: ILogger;
  readonly silenceRms: number;
  readonly now?: () => number;
}
