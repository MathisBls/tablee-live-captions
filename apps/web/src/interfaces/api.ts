import type { ApiErrorCode } from '@tablee/shared';

/** Codes d'erreur vus par le front : ceux du serveur, plus les pannes côté client. */
export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'TIMEOUT';

/** Découpe un flux `text/event-stream` en charges utiles `data:`, quel que soit le découpage réseau. */
export interface SseParser {
  /** Ajoute un morceau de texte reçu et renvoie les charges utiles des événements complets. */
  readonly push: (chunk: string) => string[];
  /** Fin du flux : renvoie l'éventuel dernier événement non terminé par une ligne vide. */
  readonly flush: () => string[];
}
