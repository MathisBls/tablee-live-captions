import type { ClientErrorCode } from '@/interfaces/api';

/** Erreur d'appel au serveur : seul le code compte, le message affiché vient du dictionnaire. */
export class ApiError extends Error {
  readonly code: ClientErrorCode;

  constructor(code: ClientErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function errorCodeOf(error: unknown): ClientErrorCode {
  return error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
}
