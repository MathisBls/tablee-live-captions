import type { CaptionSegment } from '@tablee/shared';

const TRANSCRIPT_TAG = /<\/?\s*transcript\s*>/giu;

/**
 * Le transcript va dans un bloc délimité, une ligne par segment. Toute balise qui tenterait de
 * refermer le bloc est retirée : la conversation reste une donnée, jamais une consigne.
 */
export const formatTranscriptBlock = (segments: readonly CaptionSegment[]): string => {
  const lines = segments.map((segment) => segment.text.replace(TRANSCRIPT_TAG, ' ').trim());
  return `<transcript>\n${lines.join('\n')}\n</transcript>`;
};

/** « Paul, Inès et Léa » / « Paul, Inès and Léa ». */
export const joinNames = (names: readonly string[], conjunction: string): string => {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${conjunction} ${names.at(-1) ?? ''}`;
};
