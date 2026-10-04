import type { SessionDto, SessionSettings } from '@tablee/shared';

/** Pourquoi on revient à l'accueil sans que la personne l'ait demandé. */
export type SessionNotice = 'session_lost' | 'session_ended' | 'server_unreachable';

export type SessionPhase =
  | { readonly status: 'restoring' }
  | { readonly status: 'onboarding'; readonly notice: SessionNotice | null }
  | { readonly status: 'active'; readonly session: SessionDto };

export interface SessionContextValue {
  readonly phase: SessionPhase;
  /** Derniers réglages saisis, pour pré-remplir l'accueil. */
  readonly draft: SessionSettings | null;
  /** Crée la table côté serveur. Rejette avec une `ApiError` si le serveur refuse ou ne répond pas. */
  readonly startSession: (settings: SessionSettings) => Promise<void>;
  readonly leaveTable: () => void;
  readonly endSession: (notice: SessionNotice) => void;
}

/** Une liste de prénoms en cours de saisie : ceux validés et ce qui est tapé dans le champ. */
export interface NameListState {
  readonly names: readonly string[];
  readonly draft: string;
}

export interface OnboardingForm {
  readonly listenerName: string;
  readonly nicknames: NameListState;
  readonly guests: NameListState;
  readonly listenerError: string | null;
  readonly submitError: string | null;
  readonly submitting: boolean;
  readonly setListenerName: (value: string) => void;
  readonly setNicknames: (state: NameListState) => void;
  readonly setGuests: (state: NameListState) => void;
  readonly submit: () => Promise<void>;
}
