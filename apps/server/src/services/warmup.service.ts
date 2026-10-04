import { catchError, defer, map, merge, type Observable, of } from 'rxjs';
import { createSilence, encodeWav } from '../streams';
import type { ILlmClient, ITranscriber, IWarmupService, WarmupReport } from '../interfaces';

/** Mesuré : 52 s pour charger Gemma à froid, 18 s pour le premier appel CUDA de Whisper. */
const LLM_WARMUP_TIMEOUT_MS = 180_000;
const TRANSCRIBER_WARMUP_TIMEOUT_MS = 120_000;
const WARMUP_SILENCE_MS = 1000;

/**
 * Préchauffage au démarrage, non bloquant : charge Gemma en mémoire (avec le keep_alive configuré)
 * et déclenche la compilation CUDA de Whisper, pour que la première phrase du repas soit rapide.
 */
export class WarmupService implements IWarmupService {
  constructor(
    private readonly llm: ILlmClient,
    private readonly transcriber: ITranscriber,
    private readonly now: () => number = Date.now,
  ) {}

  warmUp(): Observable<WarmupReport> {
    return merge(
      this.measure('llm', () =>
        this.llm.complete({
          messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
          temperature: 0,
          maxTokens: 4,
          timeoutMs: LLM_WARMUP_TIMEOUT_MS,
        }),
      ),
      this.measure('transcriber', () =>
        this.transcriber.transcribe({
          wav: encodeWav(createSilence(WARMUP_SILENCE_MS)),
          language: 'fr',
          prompt: '',
          timeoutMs: TRANSCRIBER_WARMUP_TIMEOUT_MS,
        }),
      ),
    );
  }

  private measure(
    component: WarmupReport['component'],
    request: () => Observable<string>,
  ): Observable<WarmupReport> {
    return defer(() => {
      const startedAt = this.now();
      const report = (succeeded: boolean): WarmupReport => ({
        component,
        durationMs: this.now() - startedAt,
        succeeded,
      });
      return request().pipe(
        map(() => report(true)),
        catchError(() => of(report(false))),
      );
    });
  }
}
