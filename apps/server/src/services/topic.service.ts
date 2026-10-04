import type { CaptionSegment, Language, PipelineState, SessionSettings } from '@tablee/shared';
import {
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  merge,
  type Observable,
  of,
  scan,
  share,
  skip,
  startWith,
  throttleTime,
} from 'rxjs';
import { countWords, sanitizeTopicLabel, topicComparisonKey } from '../models';
import { buildTopicPrompt, TOPIC_MAX_TOKENS, TOPIC_TEMPERATURE } from '../prompts';
import type {
  ILlmClient,
  ILogger,
  IMetrics,
  ITopicService,
  TopicOutcome,
  TopicServiceOptions,
  TopicWatchEvent,
} from '../interfaces';

export const DEFAULT_TOPIC_OPTIONS: TopicServiceOptions = {
  contextMs: 90_000,
  minWords: 12,
  refreshMs: 30_000,
};

const keepRecent = (
  segments: readonly CaptionSegment[],
  contextMs: number,
): readonly CaptionSegment[] => {
  const newest = segments.at(-1);
  if (newest === undefined) return segments;
  return segments.filter((segment) => segment.endedAt >= newest.endedAt - contextMs);
};

const wordsIn = (segments: readonly CaptionSegment[]): number =>
  segments.reduce((total, segment) => total + countWords(segment.text), 0);

/**
 * Bandeau « On parle de… » : un premier sujet dès qu'il y a assez de conversation, puis au plus un
 * toutes les `refreshMs`, seulement si la conversation a avancé. Une requête Gemma à la fois.
 */
export class TopicService implements ITopicService {
  constructor(
    private readonly llm: ILlmClient,
    private readonly metrics: IMetrics,
    private readonly logger: ILogger,
    private readonly options: TopicServiceOptions = DEFAULT_TOPIC_OPTIONS,
    private readonly now: () => number = Date.now,
  ) {}

  watch(
    segments: Observable<CaptionSegment>,
    settings: SessionSettings,
  ): Observable<TopicWatchEvent> {
    const outcomes = segments.pipe(
      scan(
        (window: readonly CaptionSegment[], segment: CaptionSegment) =>
          keepRecent([...window, segment], this.options.contextMs),
        [],
      ),
      filter((window) => wordsIn(window) >= this.options.minWords),
      throttleTime(this.options.refreshMs, undefined, { leading: true, trailing: true }),
      exhaustMap((window) => this.requestTopic(window, settings.language)),
      share(),
    );

    const topics = outcomes.pipe(
      filter((outcome) => outcome.kind === 'topic'),
      map((outcome) => outcome.label),
      distinctUntilChanged(
        (previous, next) => topicComparisonKey(previous) === topicComparisonKey(next),
      ),
      map((label): TopicWatchEvent => {
        this.metrics.increment('topics.updated');
        return { type: 'topic', topic: { label, at: this.now() } };
      }),
    );

    const llmStatus = outcomes.pipe(
      map((outcome): PipelineState => (outcome.kind === 'failed' ? 'degraded' : 'ok')),
      startWith<PipelineState>('ok'),
      distinctUntilChanged(),
      skip(1),
      map((state): TopicWatchEvent => ({
        type: 'status',
        status: { component: 'llm', state, at: this.now() },
      })),
    );

    return merge(topics, llmStatus);
  }

  private requestTopic(
    window: readonly CaptionSegment[],
    language: Language,
  ): Observable<TopicOutcome> {
    return this.llm
      .complete({
        messages: buildTopicPrompt(window, language),
        temperature: TOPIC_TEMPERATURE,
        maxTokens: TOPIC_MAX_TOKENS,
      })
      .pipe(
        map((answer): TopicOutcome => {
          const label = sanitizeTopicLabel(answer);
          return label === null ? { kind: 'unusable' } : { kind: 'topic', label };
        }),
        catchError((error: unknown) => {
          this.logger.warn({ err: error }, 'Topic request to the language model failed');
          return of<TopicOutcome>({ kind: 'failed' });
        }),
      );
  }
}
