import type { ApiErrorCode } from '@tablee/shared';

/** Codes d'erreur vus par le front : ceux du serveur, plus les pannes côté client. */
export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'TIMEOUT';
