import { catchError, Observable, throwError, timeout } from 'rxjs';
import { AppError, TranscriberUnavailableError } from '../errors';
import type {
  IDependencyProbe,
  IMetrics,
  ITranscriber,
  TranscriptionRequest,
  WhisperConfig,
} from '../interfaces';
import { whisperInferenceSchema } from '../schemas';

const PROBE_TIMEOUT_MS = 2000;

const toTranscriberError = (error: unknown): AppError =>
  error instanceof AppError ? error : new TranscriberUnavailableError({ cause: error });

/** Whisper via whisper.cpp server (`POST /inference`, multipart avec un fichier WAV). */
export class WhisperClient implements ITranscriber, IDependencyProbe {
  constructor(
    private readonly config: WhisperConfig,
    private readonly metrics: IMetrics,
  ) {}

  transcribe(request: TranscriptionRequest): Observable<string> {
    return new Observable<string>((subscriber) => {
      const abortController = new AbortController();
      const startedAt = performance.now();

      const run = async (): Promise<void> => {
        const response = await fetch(`${this.config.url}/inference`, {
          method: 'POST',
          body: this.buildForm(request),
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new TranscriberUnavailableError({
            cause: new Error(`whisper-server answered ${response.status}`),
          });
        }
        const result = whisperInferenceSchema.parse(await response.json());
        this.metrics.observe('transcriber.request_ms', performance.now() - startedAt);
        subscriber.next(result.text);
        subscriber.complete();
      };

      run().catch((error: unknown) => {
        if (abortController.signal.aborted) return;
        this.metrics.increment('transcriber.failures');
        subscriber.error(toTranscriberError(error));
      });

      return () => {
        abortController.abort();
      };
    }).pipe(
      timeout(request.timeoutMs ?? this.config.timeoutMs),
      catchError((error: unknown) => throwError(() => toTranscriberError(error))),
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/health`, {
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildForm(request: TranscriptionRequest): FormData {
    const form = new FormData();
    form.append('file', new Blob([request.wav], { type: 'audio/wav' }), 'chunk.wav');
    form.append('response_format', 'json');
    form.append('temperature', '0');
    form.append('language', request.language);
    form.append('prompt', request.prompt);
    return form;
  }
}
