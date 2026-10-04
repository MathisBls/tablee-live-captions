import type { Language } from '@tablee/shared';
import type { ClientErrorCode } from './api';
import type { MicFailure } from './audio';
import type { SessionNotice } from './session';
import type { TextSize, ThemeChoice } from './settings';

export interface Messages {
  readonly appName: string;
  readonly languageNames: Readonly<Record<Language, string>>;
  readonly restoring: string;
  readonly onboarding: {
    readonly eyebrow: string;
    readonly title: string;
    readonly tagline: string;
    readonly listenerLabel: string;
    readonly listenerHint: string;
    readonly listenerPlaceholder: string;
    readonly listenerRequired: string;
    readonly nicknamesLabel: string;
    readonly nicknamesHint: string;
    readonly nicknameInputLabel: string;
    readonly guestsLabel: string;
    readonly guestsHint: string;
    readonly guestInputLabel: string;
    readonly addName: string;
    readonly removeName: (name: string) => string;
    readonly languageLabel: string;
    readonly submit: string;
    readonly submitting: string;
    readonly privacy: string;
    readonly placeCardLabel: string;
    readonly placeCardEmpty: string;
    readonly placeCardGuests: (names: string) => string;
    readonly notices: Readonly<Record<SessionNotice, string>>;
  };
  readonly table: {
    readonly captionsLabel: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly backToLive: string;
    readonly topicEyebrow: string;
    readonly topicWaiting: string;
    readonly topicResting: string;
    readonly catchUpButton: string;
    readonly settingsButton: string;
    readonly mention: (name: string) => string;
    readonly reconnecting: string;
    readonly transcriberDegraded: string;
    readonly llmDegraded: string;
  };
  readonly listening: {
    readonly starting: string;
    readonly listening: string;
    readonly suspended: string;
    readonly linkDown: string;
    readonly transcriberDown: string;
    readonly failures: Readonly<Record<MicFailure, string>>;
  };
  readonly micProblem: {
    readonly titles: Readonly<Record<MicFailure, string>>;
    readonly bodies: Readonly<Record<MicFailure, string>>;
    readonly retry: string;
  };
  readonly catchUp: {
    readonly title: string;
    readonly subtitle: string;
    readonly thinking: string;
    readonly slow: string;
    readonly verySlow: string;
    readonly insufficient: string;
    readonly retry: string;
    readonly close: string;
  };
  readonly settings: {
    readonly title: string;
    readonly textSize: string;
    readonly textSizeNames: Readonly<Record<TextSize, string>>;
    readonly textPreview: string;
    readonly highContrast: string;
    readonly highContrastHint: string;
    readonly reduceMotion: string;
    readonly reduceMotionHint: string;
    readonly theme: string;
    readonly themeNames: Readonly<Record<ThemeChoice, string>>;
    readonly leave: string;
    readonly leaveHint: string;
    readonly close: string;
  };
  readonly errors: Readonly<Record<ClientErrorCode, string>>;
}

export interface I18nContextValue {
  readonly language: Language;
  readonly messages: Messages;
  readonly setLanguage: (language: Language) => void;
}
