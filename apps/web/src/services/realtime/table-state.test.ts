import type { CaptionSegment, ServerEvent } from '@tablee/shared';
import { describe, expect, it } from 'vitest';
import type { TableEvent, TableState } from '@/interfaces/table';
import {
  appendEntry,
  initialTableState,
  MAX_CAPTION_ENTRIES,
  reduceTableEvent,
} from './table-state';

function segmentId(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
}

function segment(index: number, text = `Phrase numéro ${index}`): CaptionSegment {
  return { id: segmentId(index), text, startedAt: index * 4000, endedAt: index * 4000 + 3900 };
}

function server(event: ServerEvent): TableEvent {
  return { kind: 'server', event };
}

function replay(events: readonly TableEvent[], from: TableState = initialTableState): TableState {
  return events.reduce(reduceTableEvent, from);
}

const dinner: readonly TableEvent[] = [
  { kind: 'connection', state: 'live' },
  server({
    type: 'snapshot',
    segments: [segment(1, 'On passe à table ?'), segment(2, 'Qui veut du pain ?')],
    topic: { label: 'Le pain de la boulangerie', at: 8000 },
  }),
  server({ type: 'caption', segment: segment(3, 'Mamie, tu reprends du gratin ?') }),
  server({ type: 'topic', topic: { label: 'Le gratin de Mamie', at: 12000 } }),
  server({
    type: 'mention',
    mention: {
      segmentId: segmentId(3),
      matchedName: 'Mamie',
      ranges: [{ start: 0, end: 5 }],
      at: 12100,
    },
  }),
];

describe('reduceTableEvent', () => {
  it('builds the table from a snapshot followed by live caption, topic and mention events', () => {
    const state = replay(dinner);

    expect(state.connection).toBe('live');
    expect(state.entries.map((entry) => entry.segment.text)).toEqual([
      'On passe à table ?',
      'Qui veut du pain ?',
      'Mamie, tu reprends du gratin ?',
    ]);
    expect(state.entries.map((entry) => entry.arrival)).toEqual(['history', 'history', 'live']);
    expect(state.topic?.label).toBe('Le gratin de Mamie');
    expect(state.lastMention?.matchedName).toBe('Mamie');
    expect(state.entries[2]?.highlights).toEqual([{ start: 0, end: 5 }]);
  });

  it('lets a new snapshot replace the state after a reconnection, keeping known highlights', () => {
    const beforeDrop = replay(dinner);
    const state = replay(
      [
        { kind: 'connection', state: 'reconnecting' },
        { kind: 'connection', state: 'live' },
        server({
          type: 'snapshot',
          segments: [segment(3, 'Mamie, tu reprends du gratin ?'), segment(4, 'Il est délicieux')],
          topic: null,
        }),
      ],
      beforeDrop,
    );

    expect(state.entries.map((entry) => entry.segment.id)).toEqual([segmentId(3), segmentId(4)]);
    expect(state.entries[0]?.highlights).toEqual([{ start: 0, end: 5 }]);
    expect(state.entries[0]?.arrival).toBe('live');
    expect(state.entries[1]?.arrival).toBe('history');
    expect(state.topic).toBeNull();
  });

  it('ignores a duplicated caption instead of showing it twice', () => {
    const state = replay([
      ...dinner,
      server({ type: 'caption', segment: segment(3, 'Mamie, tu reprends du gratin ?') }),
    ]);
    expect(state.entries).toHaveLength(3);
  });

  it('tracks the health of whisper and Gemma from /ready then from live status events', () => {
    const state = replay([
      {
        kind: 'readiness',
        readiness: { ready: false, dependencies: { llm: 'down', transcriber: 'up' } },
      },
      server({ type: 'status', status: { component: 'transcriber', state: 'degraded', at: 1 } }),
      server({ type: 'status', status: { component: 'llm', state: 'ok', at: 2 } }),
    ]);
    expect(state.pipeline).toEqual({ transcriber: 'degraded', llm: 'ok' });
  });

  it('remembers why the table ended', () => {
    const state = replay([...dinner, { kind: 'ended', reason: 'not_found' }]);
    expect(state.connection).toBe('ended');
    expect(state.endReason).toBe('not_found');
  });
});

describe('appendEntry', () => {
  it('keeps only the most recent entries once the limit is reached', () => {
    let entries = appendEntry([], segment(0));
    for (let index = 1; index < MAX_CAPTION_ENTRIES + 25; index += 1) {
      entries = appendEntry(entries, segment(index));
    }

    expect(entries).toHaveLength(MAX_CAPTION_ENTRIES);
    expect(entries[0]?.segment.id).toBe(segmentId(25));
    expect(entries.at(-1)?.segment.id).toBe(segmentId(MAX_CAPTION_ENTRIES + 24));
  });

  it('ignores a duplicated caption instead of showing it twice', () => {
    const state = replay([
      ...dinner,
      server({ type: 'caption', segment: segment(3, 'Mamie, tu reprends du gratin ?') }),
    ]);
    expect(state.entries).toHaveLength(3);
  });

  it('tracks the health of whisper and Gemma from /ready then from live status events', () => {
    const state = replay([
      {
        kind: 'readiness',
        readiness: { ready: false, dependencies: { llm: 'down', transcriber: 'up' } },
      },
      server({ type: 'status', status: { component: 'transcriber', state: 'degraded', at: 1 } }),
      server({ type: 'status', status: { component: 'llm', state: 'ok', at: 2 } }),
    ]);
    expect(state.pipeline).toEqual({ transcriber: 'degraded', llm: 'ok' });
  });

  it('remembers why the table ended', () => {
    const state = replay([...dinner, { kind: 'ended', reason: 'not_found' }]);
    expect(state.connection).toBe('ended');
    expect(state.endReason).toBe('not_found');
  });
});

describe('appendEntry', () => {
  it('keeps only the most recent entries once the limit is reached', () => {
    let entries = appendEntry([], segment(0));
    for (let index = 1; index < MAX_CAPTION_ENTRIES + 25; index += 1) {
      entries = appendEntry(entries, segment(index));
    }

    expect(entries).toHaveLength(MAX_CAPTION_ENTRIES);
    expect(entries[0]?.segment.id).toBe(segmentId(25));
    expect(entries.at(-1)?.segment.id).toBe(segmentId(MAX_CAPTION_ENTRIES + 24));
  });
});
