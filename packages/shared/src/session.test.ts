import { describe, expect, it } from 'vitest';
import { sessionSettingsSchema, sessionParamsSchema } from './index';

describe('sessionSettingsSchema', () => {
  it('trims names and accepts a complete onboarding', () => {
    const result = sessionSettingsSchema.parse({
      listenerName: '  Mamie ',
      nicknames: ['Mam'],
      guestNames: ['Paul', 'Inès'],
      language: 'fr',
    });
    expect(result.listenerName).toBe('Mamie');
  });

  it('rejects an empty listener name', () => {
    const result = sessionSettingsSchema.safeParse({
      listenerName: '   ',
      nicknames: [],
      guestNames: [],
      language: 'fr',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported language', () => {
    const result = sessionSettingsSchema.safeParse({
      listenerName: 'Mamie',
      nicknames: [],
      guestNames: [],
      language: 'de',
    });
    expect(result.success).toBe(false);
  });
});

describe('sessionParamsSchema', () => {
  it('only accepts UUID v4 session ids', () => {
    expect(
      sessionParamsSchema.safeParse({ sessionId: '7d9f2c1e-4b8a-4e3f-9c2d-1a5b6c7d8e9f' }).success,
    ).toBe(true);
    expect(sessionParamsSchema.safeParse({ sessionId: '../etc/passwd' }).success).toBe(false);
  });
});
