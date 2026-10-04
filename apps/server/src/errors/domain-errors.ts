import { AppError } from './app-error';

export class SessionNotFoundError extends AppError {
  readonly code = 'SESSION_NOT_FOUND';
  readonly statusCode = 404;

  constructor() {
    super('Session not found');
  }
}

export class TooManySessionsError extends AppError {
  readonly code = 'TOO_MANY_SESSIONS';
  readonly statusCode = 429;

  constructor(maxSessions: number) {
    super(`The server already hosts ${maxSessions} sessions, end one before starting another`);
  }
}

export class LlmUnavailableError extends AppError {
  readonly code = 'LLM_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(options?: ErrorOptions) {
    super('The language model is unavailable', undefined, options);
  }
}

export class TranscriberUnavailableError extends AppError {
  readonly code = 'TRANSCRIBER_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(options?: ErrorOptions) {
    super('The speech recognizer is unavailable', undefined, options);
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';

  constructor(
    publicMessage: string,
    details?: unknown,
    readonly statusCode = 400,
  ) {
    super(publicMessage, details);
  }
}

export class CorsOriginNotAllowedError extends AppError {
  readonly code = 'CORS_ORIGIN_NOT_ALLOWED';
  readonly statusCode = 403;

  constructor() {
    super('Origin not allowed');
  }
}

export class RateLimitedError extends AppError {
  readonly code = 'RATE_LIMITED';
  readonly statusCode = 429;

  constructor(retryAfter: string) {
    super(`Too many requests, retry in ${retryAfter}`);
  }
}

export class RouteNotFoundError extends AppError {
  readonly code = 'ROUTE_NOT_FOUND';
  readonly statusCode = 404;

  constructor() {
    super('Route not found');
  }
}

export class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;

  constructor() {
    super('Internal server error');
  }
}

/** Configuration invalide au démarrage : jamais renvoyée à un client, le process s'arrête. */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
