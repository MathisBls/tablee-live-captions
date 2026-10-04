import { apiErrorResponseSchema } from '@tablee/shared';
import { z } from 'zod';
import type { ClientErrorCode } from '@/interfaces/api';
import { ApiError } from './api-error';

const envelopeSchema = z.object({ data: z.unknown() });

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** `fetch` dont les pannes réseau deviennent des `ApiError('NETWORK_ERROR')`. L'annulation reste une annulation. */
export async function sendRequest(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch (error) {
    if (isAbort(error)) {
      throw error;
    }
    throw new ApiError('NETWORK_ERROR', { cause: error });
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    return null;
  }
}

function fallbackCode(status: number): ClientErrorCode {
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status === 404) {
    return 'ROUTE_NOT_FOUND';
  }
  // Le serveur Tablée répond toujours avec une enveloppe JSON : une 5xx sans enveloppe vient du
  // proxy de développement ou d'une passerelle, donc le serveur est injoignable.
  return status >= 500 ? 'NETWORK_ERROR' : 'INTERNAL_ERROR';
}

export async function readError(response: Response): Promise<ApiError> {
  const parsed = apiErrorResponseSchema.safeParse(await readJson(response));
  return new ApiError(parsed.success ? parsed.data.error.code : fallbackCode(response.status));
}

/** Lit une enveloppe `{ data }` et la valide : une réponse inattendue n'entre jamais dans l'appli. */
export async function readData<TSchema extends z.ZodType>(
  response: Response,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const envelope = envelopeSchema.safeParse(await readJson(response));
  const parsed = schema.safeParse(envelope.success ? envelope.data.data : undefined);
  if (!parsed.success) {
    throw new ApiError('INVALID_RESPONSE', { cause: parsed.error });
  }
  return parsed.data;
}
