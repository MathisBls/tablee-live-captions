import type { SessionSettings } from '@tablee/shared';
import { sessionIdSchema, sessionSettingsSchema } from '@tablee/shared';
import { z } from 'zod';
import type { DisplaySettings } from '@/interfaces/settings';

const DISPLAY_SETTINGS_KEY = 'tablee.display.v1';
const LAST_TABLE_KEY = 'tablee.last-table.v1';
const SESSION_ID_KEY = 'tablee.session-id';

export const defaultDisplaySettings: DisplaySettings = {
  textSize: 3,
  highContrast: false,
  reduceMotion: false,
  theme: 'evening',
};

const displaySettingsSchema: z.ZodType<DisplaySettings> = z.object({
  textSize: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  highContrast: z.boolean(),
  reduceMotion: z.boolean(),
  theme: z.enum(['evening', 'midday']),
});

const local = (): Storage => window.localStorage;
const session = (): Storage => window.sessionStorage;

// Le stockage peut être interdit (navigation privée, iframe) ou plein : l'appli continue alors en
// mémoire, sans rien perdre d'autre que la persistance. Même y accéder peut lever une exception.
function readItem(storage: () => Storage, key: string): unknown {
  try {
    const raw = storage().getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeItem(storage: () => Storage, key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function removeItem(storage: () => Storage, key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    return;
  }
}

export function loadDisplaySettings(): DisplaySettings {
  const parsed = displaySettingsSchema.safeParse(readItem(local, DISPLAY_SETTINGS_KEY));
  return parsed.success ? parsed.data : defaultDisplaySettings;
}

export function saveDisplaySettings(settings: DisplaySettings): void {
  writeItem(local, DISPLAY_SETTINGS_KEY, settings);
}

/** Les prénoms de la dernière table, pour ne pas tout retaper au prochain repas. */
export function loadLastTable(): SessionSettings | null {
  const parsed = sessionSettingsSchema.safeParse(readItem(local, LAST_TABLE_KEY));
  return parsed.success ? parsed.data : null;
}

export function saveLastTable(settings: SessionSettings): void {
  writeItem(local, LAST_TABLE_KEY, settings);
}

/** L'id de la table en cours survit à un rechargement de l'onglet, pas à sa fermeture. */
export function loadSessionId(): string | null {
  const parsed = sessionIdSchema.safeParse(readItem(session, SESSION_ID_KEY));
  return parsed.success ? parsed.data : null;
}

export function saveSessionId(sessionId: string): void {
  writeItem(session, SESSION_ID_KEY, sessionId);
}

export function clearSessionId(): void {
  removeItem(session, SESSION_ID_KEY);
}
