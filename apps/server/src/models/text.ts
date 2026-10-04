import type { TextToken } from '../interfaces';

/** Lettres (y compris accents combinants) et chiffres : tout le reste sépare les mots, apostrophes et tirets compris. */
const WORD_PATTERN = /[\p{L}\p{M}\p{N}]+/gu;
const COMBINING_MARKS = /\p{M}/gu;

/** « Inès » → « ines », « MAMIE » → « mamie ». */
export const normalizeWord = (word: string): string =>
  word.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();

/** Découpe en mots en gardant leur position dans le texte original (indices UTF-16, comme `String.slice`). */
export const tokenize = (text: string): readonly TextToken[] =>
  Array.from(text.matchAll(WORD_PATTERN), (match) => ({
    normalized: normalizeWord(match[0]),
    start: match.index,
    end: match.index + match[0].length,
  }));

/** Forme de comparaison d'un texte entier : mots normalisés séparés par une espace. */
export const normalizeText = (text: string): string =>
  tokenize(text)
    .map((token) => token.normalized)
    .join(' ');

export const countWords = (text: string): number => tokenize(text).length;
