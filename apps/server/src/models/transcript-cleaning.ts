import { normalizeText, tokenize } from './text';

/**
 * Phrases que Whisper produit sur du silence ou du bruit (héritage de ses données d'entraînement :
 * sous-titres de vidéos). Comparées au texte normalisé entier.
 * « Merci. » est mesuré sur la fixture room-tone : perdre un vrai « merci » isolé coûte moins
 * qu'un sous-titre fantôme toutes les dix secondes.
 */
const WHOLE_SEGMENT_HALLUCINATIONS = new Set([
  'merci',
  'merci beaucoup',
  'merci a tous',
  'au revoir',
  'thank you',
  'thank you very much',
  'thanks',
  'thanks for watching',
  'you',
  'bye',
  'so',
  'hmm',
  'euh',
]);

/** Fragments qui disqualifient le segment où qu'ils apparaissent. */
const HALLUCINATION_FRAGMENTS = [
  'sous titres realises par',
  'sous titrage',
  'amara org',
  'merci d avoir regarde',
  'abonnez vous',
  'n oubliez pas de vous abonner',
  'thanks for watching',
  'thank you for watching',
  'subtitles by',
  'please subscribe',
  'like and subscribe',
];

/** Annotations non verbales : [Musique], (rires), *applaudissements*, ♪, [BLANK_AUDIO]. */
const NON_SPEECH_ANNOTATIONS = /\[[^\]]*\]|\([^)]*\)|\*[^*]*\*|[♪♫]+/gu;
const WHITESPACE_RUN = /\s+/gu;

/**
 * Un écho du prompt (« Paul, Inès, Léa. ») contiendrait le prénom de la personne et déclencherait
 * une fausse alerte. On l'écarte dès qu'il fait au moins ce nombre de mots, tous tirés du prompt.
 */
const MIN_PROMPT_ECHO_WORDS = 3;

const isPromptEcho = (normalizedText: string, prompt: string): boolean => {
  const promptWords = new Set(tokenize(prompt).map((token) => token.normalized));
  const words = normalizedText.split(' ');
  return words.length >= MIN_PROMPT_ECHO_WORDS && words.every((word) => promptWords.has(word));
};

const containsHallucination = (normalizedText: string): boolean =>
  WHOLE_SEGMENT_HALLUCINATIONS.has(normalizedText) ||
  HALLUCINATION_FRAGMENTS.some((fragment) => normalizedText.includes(fragment));

/**
 * Nettoie la sortie brute de Whisper. Renvoie `null` si le segment ne doit pas être affiché
 * (vide, annotation seule, hallucination connue ou écho du prompt).
 */
export const cleanTranscript = (rawText: string, whisperPrompt: string): string | null => {
  const text = rawText.replace(NON_SPEECH_ANNOTATIONS, ' ').replace(WHITESPACE_RUN, ' ').trim();
  const normalized = normalizeText(text);
  if (normalized.length === 0) return null;
  if (containsHallucination(normalized) || isPromptEcho(normalized, whisperPrompt)) return null;
  return text;
};
