import { z } from 'zod';
import { GUEST_NAMES_MAX_COUNT, NICKNAMES_MAX_COUNT, PERSON_NAME_MAX_LENGTH } from './constants';

/** Langue de la conversation : pilote Whisper, les prompts Gemma et la langue de l'interface. */
export const languageSchema = z.enum(['fr', 'en']);
export type Language = z.infer<typeof languageSchema>;

export const personNameSchema = z.string().trim().min(1).max(PERSON_NAME_MAX_LENGTH);

/** Réglages de session, saisis à l'accueil. C'est aussi le corps de POST /api/sessions. */
export const sessionSettingsSchema = z.object({
  /** Prénom de la personne qui entend mal : déclenche l'alerte « On te parle ». */
  listenerName: personNameSchema,
  /** Surnoms qui déclenchent aussi l'alerte. */
  nicknames: z.array(personNameSchema).max(NICKNAMES_MAX_COUNT),
  /** Prénoms des convives : injectés dans le prompt Whisper pour mieux les reconnaître. */
  guestNames: z.array(personNameSchema).max(GUEST_NAMES_MAX_COUNT),
  language: languageSchema,
});
export type SessionSettings = z.infer<typeof sessionSettingsSchema>;

/** UUID v4 généré côté serveur. */
export const sessionIdSchema = z.uuid({ version: 'v4' });

/** Paramètres d'URL de toutes les routes `/api/sessions/:sessionId/...` et `/ws/sessions/:sessionId/...`. */
export const sessionParamsSchema = z.object({ sessionId: sessionIdSchema });
export type SessionParams = z.infer<typeof sessionParamsSchema>;

export const sessionDtoSchema = z.object({
  id: sessionIdSchema,
  settings: sessionSettingsSchema,
  /** Epoch en millisecondes. */
  createdAt: z.number().int().nonnegative(),
  /** Epoch en millisecondes : la session et tout son transcript sont purgés à cette date. */
  expiresAt: z.number().int().nonnegative(),
});
export type SessionDto = z.infer<typeof sessionDtoSchema>;
