import type { ApiErrorCode } from '@tablee/shared';

/**
 * Base de toutes les erreurs renvoyées au client. Seuls `code`, `publicMessage` et `details`
 * sortent du serveur ; la `cause` reste dans les logs.
 */
export abstract class AppError extends Error {
  abstract readonly code: ApiErrorCode;
  abstract readonly statusCode: number;

  constructor(
    public readonly publicMessage: string,
    public readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(publicMessage, options);
    this.name = new.target.name;
  }
}
