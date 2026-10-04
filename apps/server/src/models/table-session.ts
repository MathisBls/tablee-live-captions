import { randomUUID } from 'node:crypto';
import type {
  CaptionSegment,
  MentionAlert,
  SessionDto,
  SessionSettings,
  TextRange,
} from '@tablee/shared';
import type { NameMatch, PcmChunk, TableSession } from '../interfaces';

const MS_PER_MINUTE = 60_000;

export const createTableSession = (
  settings: SessionSettings,
  now: number,
  ttlMinutes: number,
): TableSession => ({
  id: randomUUID(),
  settings,
  createdAt: now,
  expiresAt: now + ttlMinutes * MS_PER_MINUTE,
});

export const toSessionDto = (session: TableSession): SessionDto => ({
  id: session.id,
  settings: session.settings,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
});

export const createCaptionSegment = (text: string, chunk: PcmChunk): CaptionSegment => ({
  id: randomUUID(),
  text,
  startedAt: chunk.startedAt,
  endedAt: chunk.endedAt,
});

const mergeOverlappingRanges = (ranges: readonly TextRange[]): TextRange[] =>
  [...ranges]
    .sort((left, right) => left.start - right.start)
    .reduce<TextRange[]>((merged, range) => {
      const previous = merged.at(-1);
      if (previous !== undefined && range.start <= previous.end) {
        merged[merged.length - 1] = {
          start: previous.start,
          end: Math.max(previous.end, range.end),
        };
      } else {
        merged.push(range);
      }
      return merged;
    }, []);

/**
 * Une seule alerte par segment, même si plusieurs surnoms y sont prononcés : l'écran pulse une fois,
 * et toutes les occurrences sont surlignées.
 */
export const createMentionAlert = (
  segment: CaptionSegment,
  matches: readonly NameMatch[],
  at: number,
): MentionAlert | null => {
  const [first] = [...matches].sort((left, right) => left.range.start - right.range.start);
  if (first === undefined) return null;
  return {
    segmentId: segment.id,
    matchedName: first.name,
    ranges: mergeOverlappingRanges(matches.map((match) => match.range)),
    at,
  };
};
