import type { ReadinessDto, SessionDto, SessionSettings } from '@tablee/shared';
import { API_PATHS, readinessDtoSchema, sessionDtoSchema } from '@tablee/shared';
import { readData, readError, sendRequest } from './http';

const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

export async function createSession(settings: SessionSettings): Promise<SessionDto> {
  const response = await sendRequest(API_PATHS.sessions, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw await readError(response);
  }
  return readData(response, sessionDtoSchema);
}

export async function fetchSession(sessionId: string): Promise<SessionDto> {
  const response = await sendRequest(API_PATHS.session(sessionId), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw await readError(response);
  }
  return readData(response, sessionDtoSchema);
}

/** Ferme la table. `keepalive` laisse partir la requête même si la page se ferme juste après. */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await sendRequest(API_PATHS.session(sessionId), {
    method: 'DELETE',
    keepalive: true,
  });
  if (!response.ok && response.status !== 404) {
    throw await readError(response);
  }
}

/** `/ready` répond 200 ou 503 avec le même corps : les deux décrivent l'état d'Ollama et de whisper. */
export async function fetchReadiness(): Promise<ReadinessDto> {
  const response = await sendRequest(API_PATHS.ready, { headers: { Accept: 'application/json' } });
  if (!response.ok && response.status !== 503) {
    throw await readError(response);
  }
  return readData(response, readinessDtoSchema);
}
