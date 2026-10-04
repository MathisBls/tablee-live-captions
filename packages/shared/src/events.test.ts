import { describe, expect, it } from 'vitest';
import { aiStreamEventSchema, serverEventSchema } from './index';

const segmentId = '7d9f2c1e-4b8a-4e3f-9c2d-1a5b6c7d8e9f';

describe('serverEventSchema', () => {
  it('accepts a caption event', () => {
    const result = serverEventSchema.safeParse({
      type: 'caption',
      segment: { id: segmentId, text: 'On passe à table', startedAt: 1000, endedAt: 4000 },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a mention event with highlight ranges', () => {
    const result = serverEventSchema.safeParse({
      type: 'mention',
      mention: { segmentId, matchedName: 'Mamie', ranges: [{ start: 0, end: 5 }], at: 4000 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty highlight range', () => {
    const result = serverEventSchema.safeParse({
      type: 'mention',
      mention: { segmentId, matchedName: 'Mamie', ranges: [{ start: 3, end: 3 }], at: 4000 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown event type', () => {
    expect(serverEventSchema.safeParse({ type: 'laugh' }).success).toBe(false);
  });
});

describe('aiStreamEventSchema', () => {
  it('accepts an error event with a known code only', () => {
    expect(
      aiStreamEventSchema.safeParse({ type: 'error', code: 'LLM_UNAVAILABLE', message: 'x' })
        .success,
    ).toBe(true);
    expect(
      aiStreamEventSchema.safeParse({ type: 'error', code: 'KABOOM', message: 'x' }).success,
    ).toBe(false);
  });
});
