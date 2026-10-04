import type { Language } from '@tablee/shared';
import { languageSchema } from '@tablee/shared';
import type { Messages } from '@/interfaces/i18n';
import { en } from './en';
import { fr } from './fr';

export const messagesByLanguage: Readonly<Record<Language, Messages>> = { fr, en };

/** Langue de l'interface avant toute session : celle du navigateur si on la parle, sinon le français. */
export function browserLanguage(): Language {
  const primary = navigator.language.slice(0, 2).toLowerCase();
  const parsed = languageSchema.safeParse(primary);
  return parsed.success ? parsed.data : 'fr';
}
