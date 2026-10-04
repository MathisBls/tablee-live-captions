import type { Observable } from 'rxjs';

export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  readonly role: LlmRole;
  readonly content: string;
}

export interface LlmRequest {
  readonly messages: readonly LlmMessage[];
  readonly temperature: number;
  /** Plafond de tokens générés : borne la latence et coupe court à une réponse qui s'emballe. */
  readonly maxTokens: number;
  /** Délai max avant le premier token puis entre deux tokens ; par défaut celui de la configuration. */
  readonly timeoutMs?: number;
}

export interface ILlmClient {
  /** Tokens au fil de l'eau. Se désabonner annule la requête HTTP en cours. */
  stream(request: LlmRequest): Observable<string>;
  /** Réponse complète, en une seule émission. */
  complete(request: LlmRequest): Observable<string>;
}

/** Une dépendance externe joignable ou non (pour /ready). */
export interface IDependencyProbe {
  isAvailable(): Promise<boolean>;
}
