import type { AiStreamEvent, CaptionSegment } from '@tablee/shared';
import { catchError, concat, defer, map, type Observable, of } from 'rxjs';
import { AppError, SessionNotFoundError } from '../errors';
import { countWords } from '../models';
import { buildCatchUpPrompt, CATCH_UP_MAX_TOKENS, CATCH_UP_TEMPERATURE } from '../prompts';
import type {
  AssistantProfile,
  IAssistantService,
  ILlmClient,
  ILogger,
  ISessionRepository,
} from '../interfaces';

/** « Qu'est-ce que j'ai raté ? » : les 3 dernières minutes. */
export const CATCH_UP_PROFILE: AssistantProfile = {
  name: 'catch-up',
  lookbackMs: 3 * 60_000,
  minWords: 8,
  temperature: CATCH_UP_TEMPERATURE,
  maxTokens: CATCH_UP_MAX_TOKENS,
  buildPrompt: buildCatchUpPrompt,
};

const wordsIn = (segments: readonly CaptionSegment[]): number =>
  segments.reduce((total, segment) => total + countWords(segment.text), 0);

const toErrorEvent = (error: unknown): AiStreamEvent =>
  error instanceof AppError
    ? { type: 'error', code: error.code, message: error.publicMessage }
    : { type: 'error', code: 'INTERNAL_ERROR', message: 'Internal server error' };

/**
 * Réponse de Gemma sur le transcript récent, en tokens. Le flux se termine toujours par `done`,
 * `insufficient_context` ou `error`, et n'échoue jamais : l'erreur devient un événement.
 */
export class TranscriptAssistantService implements IAssistantService {
  constructor(
    private readonly profile: AssistantProfile,
    private readonly repository: ISessionRepository,
    private readonly llm: ILlmClient,
    private readonly logger: ILogger,
    private readonly now: () => number = Date.now,
  ) {}

  respond(sessionId: string): Observable<AiStreamEvent> {
    return defer(() => {
      const session = this.repository.findById(sessionId);
      if (session === undefined) throw new SessionNotFoundError();
      const segments = this.repository.segmentsSince(
        sessionId,
        this.now() - this.profile.lookbackMs,
      );
      if (wordsIn(segments) < this.profile.minWords) {
        return of<AiStreamEvent>({ type: 'insufficient_context' });
      }
      const tokens = this.llm
        .stream({
          messages: this.profile.buildPrompt(segments, session.settings),
          temperature: this.profile.temperature,
          maxTokens: this.profile.maxTokens,
        })
        .pipe(map((text): AiStreamEvent => ({ type: 'token', text })));
      return concat(tokens, of<AiStreamEvent>({ type: 'done' }));
    }).pipe(
      catchError((error: unknown) => {
        this.logger.warn({ err: error, assistant: this.profile.name }, 'Assistant request failed');
        return of(toErrorEvent(error));
      }),
    );
  }
}
