import { catchError, Observable, reduce, throwError, timeout } from 'rxjs';
import { AppError, LlmUnavailableError } from '../errors';
import type {
  IDependencyProbe,
  ILlmClient,
  IMetrics,
  LlmRequest,
  OllamaConfig,
} from '../interfaces';
import { ollamaChatLineSchema, ollamaTagsSchema } from '../schemas';
import { readLines } from './ndjson';

const PROBE_TIMEOUT_MS = 2000;

const toLlmError = (error: unknown): AppError =>
  error instanceof AppError ? error : new LlmUnavailableError({ cause: error });

/** Gemma via l'API locale d'Ollama (`/api/chat`, NDJSON en streaming). */
export class OllamaClient implements ILlmClient, IDependencyProbe {
  constructor(
    private readonly config: OllamaConfig,
    private readonly metrics: IMetrics,
  ) {}

  stream(request: LlmRequest): Observable<string> {
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs;
    return new Observable<string>((subscriber) => {
      const abortController = new AbortController();
      const startedAt = performance.now();
      let receivedFirstToken = false;
      this.metrics.increment('llm.requests');

      const run = async (): Promise<void> => {
        const response = await fetch(`${this.config.url}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(this.buildChatBody(request)),
          signal: abortController.signal,
        });
        if (!response.ok || response.body === null) {
          throw new LlmUnavailableError({ cause: new Error(`Ollama answered ${response.status}`) });
        }
        for await (const line of readLines(response.body)) {
          const chunk = ollamaChatLineSchema.parse(JSON.parse(line));
          if (chunk.error !== undefined) {
            throw new LlmUnavailableError({ cause: new Error(chunk.error) });
          }
          const token = chunk.message?.content ?? '';
          if (token.length > 0) {
            if (!receivedFirstToken) {
              receivedFirstToken = true;
              this.metrics.observe('llm.first_token_ms', performance.now() - startedAt);
            }
            subscriber.next(token);
          }
          if (chunk.done) break;
        }
        this.metrics.observe('llm.total_ms', performance.now() - startedAt);
        subscriber.complete();
      };

      run().catch((error: unknown) => {
        if (abortController.signal.aborted) return;
        this.metrics.increment('llm.failures');
        subscriber.error(toLlmError(error));
      });

      return () => {
        abortController.abort();
      };
    }).pipe(
      timeout({ first: timeoutMs, each: timeoutMs }),
      catchError((error: unknown) => throwError(() => toLlmError(error))),
    );
  }

  complete(request: LlmRequest): Observable<string> {
    return this.stream(request).pipe(reduce((text, token) => text + token, ''));
  }

  /** Ollama répond et le modèle configuré est téléchargé. */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.url}/api/tags`, {
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      if (!response.ok) return false;
      const tags = ollamaTagsSchema.parse(await response.json());
      return tags.models.some((model) => this.isConfiguredModel(model.name));
    } catch {
      return false;
    }
  }

  private isConfiguredModel(name: string): boolean {
    const configured = this.config.model.includes(':')
      ? this.config.model
      : `${this.config.model}:latest`;
    return name === configured;
  }

  private buildChatBody(request: LlmRequest): object {
    return {
      model: this.config.model,
      messages: request.messages,
      stream: true,
      // Gemma 4 « réfléchit » par défaut : on veut un premier token immédiat, pas un raisonnement.
      think: false,
      keep_alive: this.config.keepAlive,
      options: {
        num_ctx: this.config.numCtx,
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
    };
  }
}
