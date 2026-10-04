/** Format audio envoyé par le client sur /ws/sessions/:id/audio : PCM16 little-endian, mono, 16 kHz. */
export const AUDIO_SAMPLE_RATE = 16_000;
export const AUDIO_FRAME_MS = 100;
export const AUDIO_BYTES_PER_SAMPLE = 2;
/** 100 ms à 16 kHz en PCM16 = 1 600 échantillons = 3 200 octets. */
export const AUDIO_FRAME_BYTES =
  (AUDIO_SAMPLE_RATE * AUDIO_FRAME_MS * AUDIO_BYTES_PER_SAMPLE) / 1000;
/** Taille max d'un message binaire audio accepté par le serveur (marge pour des trames regroupées). */
export const AUDIO_MAX_MESSAGE_BYTES = 64 * 1024;

export const PERSON_NAME_MAX_LENGTH = 40;
export const NICKNAMES_MAX_COUNT = 10;
export const GUEST_NAMES_MAX_COUNT = 20;

/** Nombre de segments renvoyés dans l'événement `snapshot` à la connexion d'un client. */
export const SNAPSHOT_MAX_SEGMENTS = 50;

/**
 * Codes de fermeture WebSocket applicatifs (plage 4000-4999 réservée aux applications).
 * Le client ne se reconnecte pas sur SESSION_NOT_FOUND, SESSION_ENDED et ORIGIN_FORBIDDEN.
 */
export const WS_CLOSE_CODES = {
  INVALID_MESSAGE: 4400,
  ORIGIN_FORBIDDEN: 4403,
  SESSION_NOT_FOUND: 4404,
  SESSION_ENDED: 4410,
  TOO_MANY_CLIENTS: 4429,
} as const;

export const API_PATHS = {
  health: '/health',
  ready: '/ready',
  sessions: '/api/sessions',
  session: (sessionId: string) => `/api/sessions/${sessionId}`,
  catchUp: (sessionId: string) => `/api/sessions/${sessionId}/catch-up`,
  laugh: (sessionId: string) => `/api/sessions/${sessionId}/laugh`,
  audioSocket: (sessionId: string) => `/ws/sessions/${sessionId}/audio`,
  eventsSocket: (sessionId: string) => `/ws/sessions/${sessionId}/events`,
} as const;
