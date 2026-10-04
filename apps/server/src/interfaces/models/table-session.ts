import type { SessionSettings, TextRange } from '@tablee/shared';

export interface TableSession {
  readonly id: string;
  readonly settings: SessionSettings;
  readonly createdAt: number;
  readonly expiresAt: number;
}

/** Une occurrence du prénom ou d'un surnom dans un texte. */
export interface NameMatch {
  /** Forme de référence configurée à l'accueil (pas la forme entendue). */
  readonly name: string;
  readonly range: TextRange;
}

export type NameDetectionSettings = Pick<
  SessionSettings,
  'listenerName' | 'nicknames' | 'guestNames'
>;

/** Un mot du texte original, avec sa forme normalisée (minuscules, sans accents) et sa position. */
export interface TextToken {
  readonly normalized: string;
  readonly start: number;
  readonly end: number;
}

/** Prénom ou surnom préparé pour la détection : forme de référence et mots normalisés. */
export interface NameTarget {
  readonly reference: string;
  readonly words: readonly string[];
}
