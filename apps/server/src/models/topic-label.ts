import { countWords, normalizeText } from './text';

const MIN_TOPIC_WORDS = 1;
const MAX_TOPIC_WORDS = 6;
const MAX_TOPIC_LENGTH = 80;

/** Réponses par lesquelles le prompt demande à Gemma de signaler qu'il n'y a pas de sujet clair. */
const NO_TOPIC_ANSWERS = new Set(['aucun', 'none', 'aucun sujet', 'no topic']);

const LABEL_PREFIX =
  /^(sujet|topic|le sujet|the topic|on parle de|we are talking about)\s*[:-]\s*/iu;
const MARKDOWN_MARKS = /[*_`#>]+/gu;
const SURROUNDING_QUOTES = /^["'«»“”‘’\s]+|["'«»“”‘’\s]+$/gu;
const TRAILING_PUNCTUATION = /[\s.!?…;:,]+$/u;
const WHITESPACE_RUN = /\s+/gu;

const firstNonEmptyLine = (text: string): string =>
  text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? '';

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/**
 * Valide et nettoie le sujet renvoyé par Gemma : une ligne, sans markdown, guillemets ni ponctuation
 * finale, au plus six mots. Renvoie `null` si la réponse est inutilisable (on garde alors l'ancien sujet).
 */
export const sanitizeTopicLabel = (rawAnswer: string): string | null => {
  const label = firstNonEmptyLine(rawAnswer)
    .replace(MARKDOWN_MARKS, '')
    .replace(LABEL_PREFIX, '')
    .replace(SURROUNDING_QUOTES, '')
    .replace(TRAILING_PUNCTUATION, '')
    .replace(SURROUNDING_QUOTES, '')
    .replace(WHITESPACE_RUN, ' ')
    .trim();

  const wordCount = countWords(label);
  if (wordCount < MIN_TOPIC_WORDS || wordCount > MAX_TOPIC_WORDS) return null;
  if (label.length > MAX_TOPIC_LENGTH) return null;
  if (NO_TOPIC_ANSWERS.has(normalizeText(label))) return null;
  return capitalize(label);
};

/** Deux libellés qui ne diffèrent que par la casse, les accents ou la ponctuation sont le même sujet. */
export const topicComparisonKey = (label: string): string => normalizeText(label);
