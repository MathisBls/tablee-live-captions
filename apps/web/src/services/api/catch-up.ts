import type { AiStreamEvent } from '@tablee/shared';
import { aiStreamEventSchema, API_PATHS } from '@tablee/shared';
import { Observable } from 'rxjs';
import { ApiError } from './api-error';
import { readError, sendRequest } from './http';
import { createSseParser } from './sse';

function parseAiEvent(payload: string): AiStreamEvent | null {
  try {
    const parsed = aiStreamEventSchema.safeParse(JSON.parse(payload));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function* readSsePayloads(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // `stream: true` garde en réserve un caractère UTF-8 coupé entre deux paquets réseau.
      yield* parser.push(decoder.decode(value, { stream: true }));
    }
    yield* parser.push(decoder.decode());
    yield* parser.flush();
  } finally {
    reader.releaseLock();
  }
}

/**
 * Résumé « Qu'est-ce que j'ai raté ? » streamé par Gemma. EventSource ne sait pas faire de POST :
 * on lit le corps de `fetch` à la main. Se désabonner annule la requête, donc la génération côté serveur.
 */
export function streamCatchUp(sessionId: string): Observable<AiStreamEvent> {
  return new Observable<AiStreamEvent>((subscriber) => {
    const controller = new AbortController();

    const run = async (): Promise<void> => {
      const response = await sendRequest(API_PATHS.catchUp(sessionId), {
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw await readError(response);
      }
      if (response.body === null) {
        throw new ApiError('INVALID_RESPONSE');
      }
      for await (const payload of readSsePayloads(response.body)) {
        const event = parseAiEvent(payload);
        if (event !== null) {
          subscriber.next(event);
        }
      }
      subscriber.complete();
    };

    run().catch((error: unknown) => {
      if (!controller.signal.aborted) {
        subscriber.error(error);
      }
    });

    return () => {
      controller.abort();
    };
  });
}
