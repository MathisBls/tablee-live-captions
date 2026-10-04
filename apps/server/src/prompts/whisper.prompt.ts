import type { SessionSettings } from '@tablee/shared';
import { joinNames } from './transcript-block';

/**
 * Amorce Whisper : une phrase naturelle dans la langue du repas qui contient tous les prénoms,
 * pour qu'il les reconnaisse et les orthographie comme à l'accueil.
 */
export const buildWhisperPrompt = (settings: SessionSettings): string => {
  const names = [
    ...new Set([...settings.guestNames, settings.listenerName, ...settings.nicknames]),
  ];
  if (settings.language === 'fr') {
    return names.length === 0
      ? 'Repas de famille.'
      : `Repas de famille avec ${joinNames(names, 'et')}.`;
  }
  return names.length === 0 ? 'Family dinner.' : `Family dinner with ${joinNames(names, 'and')}.`;
};
