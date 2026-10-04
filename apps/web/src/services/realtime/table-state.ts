import type { CaptionSegment, MentionAlert, ServerEvent } from '@tablee/shared';
import type { CaptionEntry, TableEvent, TableState } from '@/interfaces/table';

/** Un repas de deux heures produit ~1 800 segments : on n'en garde que 200 dans le DOM. */
export const MAX_CAPTION_ENTRIES = 200;

export const initialTableState: TableState = {
  entries: [],
  topic: null,
  lastMention: null,
  pipeline: { transcriber: 'ok', llm: 'ok' },
  connection: 'connecting',
  endReason: null,
};

/** Ajoute un segment en fin de fil (ou le remplace s'il est déjà là) et garde les 200 derniers. */
export function appendEntry(
  entries: readonly CaptionEntry[],
  segment: CaptionSegment,
): readonly CaptionEntry[] {
  if (entries.some((entry) => entry.segment.id === segment.id)) {
    return entries.map((entry) => (entry.segment.id === segment.id ? { ...entry, segment } : entry));
  }
  const next = [...entries, { segment, highlights: [], arrival: 'live' as const }];
  return next.length > MAX_CAPTION_ENTRIES ? next.slice(-MAX_CAPTION_ENTRIES) : next;
}

/** Le snapshot remplace l'état, en gardant les surlignages des segments déjà connus. */
function applySnapshot(
  state: TableState,
  segments: readonly CaptionSegment[],
  topic: TableState['topic'],
): TableState {
  const known = new Map(state.entries.map((entry) => [entry.segment.id, entry]));
  const entries = segments.slice(-MAX_CAPTION_ENTRIES).map((segment): CaptionEntry => {
    const previous = known.get(segment.id);
    return previous === undefined
      ? { segment, highlights: [], arrival: 'history' }
      : { ...previous, segment };
  });
  return { ...state, entries, topic, connection: 'live', endReason: null };
}

function applyMention(state: TableState, mention: MentionAlert): TableState {
  const entries = state.entries.map((entry) =>
    entry.segment.id === mention.segmentId ? { ...entry, highlights: mention.ranges } : entry,
  );
  return { ...state, entries, lastMention: mention };
}

function applyServerEvent(state: TableState, event: ServerEvent): TableState {
  switch (event.type) {
    case 'snapshot':
      return applySnapshot(state, event.segments, event.topic);
    case 'caption':
      return { ...state, entries: appendEntry(state.entries, event.segment) };
    case 'topic':
      return { ...state, topic: event.topic };
    case 'mention':
      return applyMention(state, event.mention);
    case 'status':
      return {
        ...state,
        pipeline: { ...state.pipeline, [event.status.component]: event.status.state },
      };
  }
}

export function reduceTableEvent(state: TableState, event: TableEvent): TableState {
  switch (event.kind) {
    case 'server':
      return applyServerEvent(state, event.event);
    case 'connection':
      return { ...state, connection: event.state };
    case 'ended':
      return { ...state, connection: 'ended', endReason: event.reason };
    case 'readiness':
      return {
        ...state,
        pipeline: {
          transcriber: event.readiness.dependencies.transcriber === 'up' ? 'ok' : 'degraded',
          llm: event.readiness.dependencies.llm === 'up' ? 'ok' : 'degraded',
        },
      };
  }
}
