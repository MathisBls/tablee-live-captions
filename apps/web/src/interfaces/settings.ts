export type TextSize = 1 | 2 | 3 | 4;

export type ThemeChoice = 'evening' | 'midday';

/** Réglages d'affichage, propres à l'appareil (persistés dans localStorage). */
export interface DisplaySettings {
  readonly textSize: TextSize;
  readonly highContrast: boolean;
  readonly reduceMotion: boolean;
  readonly theme: ThemeChoice;
}

export interface SettingsContextValue {
  readonly settings: DisplaySettings;
  /** Réglage « animations réduites » ou préférence système `prefers-reduced-motion`. */
  readonly reducedMotion: boolean;
  readonly update: (patch: Partial<DisplaySettings>) => void;
}
