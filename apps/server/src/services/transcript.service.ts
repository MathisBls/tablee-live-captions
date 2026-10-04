import {
  SNAPSHOT_MAX_SEGMENTS,
  type CaptionSegment,
  type PipelineComponent,
  type PipelineState,
  type ServerEvent,
  type SessionSettings,
} from '@tablee/shared';
import {
  BehaviorSubject,
  catchError,
  concat,
  concatMap,
  defer,
  EMPTY,
  filter,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  ReplaySubject,
  share,
  skip,
  Subject,
  type Subscription,
  takeUntil,
  tap,
} from 'rxjs';
import { SessionNotFoundError } from '../errors';
import { cleanTranscript, createCaptionSegment, createMentionAlert } from '../models';
import { buildWhisperPrompt } from '../prompts';
import { chunkAudio, DEFAULT_CHUNK_OPTIONS, encodeWav, retryWithBackoff } from '../streams';
import type {
  AudioSignal,
  ITranscriptService,
  PcmChunk,
  TableSession,
  TranscriptServiceDependencies,
} from '../interfaces';

/** Une fenêtre qui attend Whisper depuis plus longtemps ne sert plus à personne : on la saute. */
const STALE_CHUNK_MS = 20_000;
const TRANSCRIBER_RETRY = { count: 2, baseDelayMs: 300 } as const;
const PIPELINE_COMPONENTS: readonly PipelineComponent[] = ['transcriber', 'llm'];

/** État vivant d'une session : entrée audio, fin de vie, santé des composants, flux d'événements. */
class LivePipeline {
  readonly audio = new Subject<AudioSignal>();
  readonly destroyed = new ReplaySubject<void>(1);
  readonly states = new Map<PipelineComponent, BehaviorSubject<PipelineState>>(
    PIPELINE_COMPONENTS.map((component) => [component, new BehaviorSubject<PipelineState>('ok')]),
  );
  events: Observable<ServerEvent> = EMPTY;
  subscription: Subscription | null = null;

  constructor(readonly session: TableSession) {}

  report(component: PipelineComponent, state: PipelineState): void {
    const current = this.states.get(component);
    if (current !== undefined && current.value !== state) current.next(state);
  }

  stateChanges(now: () => number): Observable<ServerEvent> {
    return merge(
      ...[...this.states].map(([component, state]) =>
        state.pipe(
          skip(1),
          map((value): ServerEvent => ({
            type: 'status',
            status: { component, state: value, at: now() },
          })),
        ),
      ),
    );
  }

  currentStates(now: () => number): ServerEvent[] {
    return [...this.states].map(([component, state]) => ({
      type: 'status',
      status: { component, state: state.value, at: now() },
    }));
  }

  destroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this.audio.complete();
    this.subscription?.unsubscribe();
    this.states.forEach((state) => {
      state.complete();
    });
  }
}

/**
 * Pipeline temps réel par session :
 * audio → fenêtres de parole → Whisper → filtre → segment → (sous-titre, alerte prénom, sujet).
 * Un échec de Whisper ou de Gemma ne coupe jamais le flux : il devient un événement `status`.
 */
export class TranscriptService implements ITranscriptService {
  private readonly pipelines = new Map<string, LivePipeline>();
  private readonly now: () => number;

  constructor(private readonly dependencies: TranscriptServiceDependencies) {
    this.now = dependencies.now ?? Date.now;
  }

  start(session: TableSession): void {
    const pipeline = new LivePipeline(session);
    const { repository, topics } = this.dependencies;
    const whisperPrompt = buildWhisperPrompt(session.settings);

    const segments = pipeline.audio.pipe(
      chunkAudio({
        ...DEFAULT_CHUNK_OPTIONS,
        silenceRms: this.dependencies.silenceRms,
        now: this.now,
      }),
      concatMap((chunk) => this.transcribe(chunk, session.settings, whisperPrompt, pipeline)),
      tap((segment) => {
        repository.appendSegment(session.id, segment);
      }),
      share(),
    );

    const captions = segments.pipe(map((segment): ServerEvent => ({ type: 'caption', segment })));
    const mentions = segments.pipe(
      mergeMap((segment) => this.detectMention(segment, session.settings)),
    );
    const topicEvents = topics.watch(segments, session.settings).pipe(
      mergeMap((event): Observable<ServerEvent> => {
        if (event.type === 'status') {
          pipeline.report(event.status.component, event.status.state);
          return EMPTY;
        }
        repository.setTopic(session.id, event.topic);
        return of(event);
      }),
    );

    pipeline.events = merge(captions, mentions, topicEvents, pipeline.stateChanges(this.now)).pipe(
      takeUntil(pipeline.destroyed),
      share(),
    );
    pipeline.subscription = pipeline.events.subscribe({
      error: (error: unknown) => {
        this.dependencies.logger.error(
          { err: error, sessionId: session.id },
          'Session pipeline crashed',
        );
      },
    });
    this.pipelines.set(session.id, pipeline);
  }

  stop(sessionId: string): void {
    const pipeline = this.pipelines.get(sessionId);
    if (pipeline === undefined) return;
    this.pipelines.delete(sessionId);
    pipeline.destroy();
  }

  pushAudio(sessionId: string, bytes: Uint8Array): void {
    this.dependencies.metrics.increment('audio.frames_received');
    this.require(sessionId).audio.next({ kind: 'frame', bytes });
  }

  flushAudio(sessionId: string): void {
    this.pipelines.get(sessionId)?.audio.next({ kind: 'flush' });
  }

  events(sessionId: string): Observable<ServerEvent> {
    return defer(() => {
      const pipeline = this.require(sessionId);
      const snapshot: ServerEvent = {
        type: 'snapshot',
        segments: [
          ...this.dependencies.repository.latestSegments(sessionId, SNAPSHOT_MAX_SEGMENTS),
        ],
        topic: this.dependencies.repository.currentTopic(sessionId),
      };
      return concat(of(snapshot, ...pipeline.currentStates(this.now)), pipeline.events);
    });
  }

  ended(sessionId: string): Observable<void> {
    return defer(() => this.require(sessionId).destroyed);
  }

  private require(sessionId: string): LivePipeline {
    const pipeline = this.pipelines.get(sessionId);
    if (pipeline === undefined) throw new SessionNotFoundError();
    return pipeline;
  }

  private transcribe(
    chunk: PcmChunk,
    settings: SessionSettings,
    whisperPrompt: string,
    pipeline: LivePipeline,
  ): Observable<CaptionSegment> {
    const { metrics, transcriber, logger } = this.dependencies;
    if (this.now() - chunk.endedAt > STALE_CHUNK_MS) {
      metrics.increment('audio.chunks_dropped_stale');
      return EMPTY;
    }
    metrics.increment('audio.chunks_emitted');
    return transcriber
      .transcribe({ wav: encodeWav(chunk.pcm), language: settings.language, prompt: whisperPrompt })
      .pipe(
        retryWithBackoff(TRANSCRIBER_RETRY),
        tap(() => {
          pipeline.report('transcriber', 'ok');
        }),
        map((rawText) => cleanTranscript(rawText, whisperPrompt)),
        filter((text): text is string => {
          if (text === null) metrics.increment('transcriber.hallucinations_filtered');
          return text !== null;
        }),
        map((text) => createCaptionSegment(text, chunk)),
        tap(() => {
          metrics.increment('transcriber.segments');
          metrics.observe('pipeline.window_to_caption_ms', this.now() - chunk.endedAt);
        }),
        catchError((error: unknown) => {
          logger.warn({ err: error, sessionId: pipeline.session.id }, 'Transcription failed');
          pipeline.report('transcriber', 'degraded');
          return EMPTY;
        }),
      );
  }

  private detectMention(
    segment: CaptionSegment,
    settings: SessionSettings,
  ): Observable<ServerEvent> {
    const matches = this.dependencies.nameDetector.detect(segment.text, settings);
    const mention = createMentionAlert(segment, matches, this.now());
    if (mention === null) return EMPTY;
    this.dependencies.metrics.increment('mentions.detected');
    return of({ type: 'mention', mention });
  }
}
