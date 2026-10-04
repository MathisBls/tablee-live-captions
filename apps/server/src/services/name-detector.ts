import { tokenize } from '../models';
import type {
  INameDetector,
  NameDetectionSettings,
  NameMatch,
  NameTarget,
  TextToken,
} from '../interfaces';
import { levenshtein } from './levenshtein';

/**
 * Mots de parenté proches les uns des autres (« grandpa » / « grandma », « mamie » / « mamy »…).
 * Ils ne sont jamais pris pour une variante approximative d'un autre nom : seule l'égalité exacte compte.
 */
const KINSHIP_WORDS = [
  'mamie',
  'mamy',
  'mami',
  'meme',
  'papi',
  'papy',
  'pepe',
  'maman',
  'papa',
  'tata',
  'tatie',
  'tonton',
  'grandma',
  'grandpa',
  'granny',
  'grandad',
  'granddad',
  'grandmother',
  'grandfather',
  'nana',
  'mom',
  'mum',
  'dad',
  'aunt',
  'auntie',
  'uncle',
];

/** Plus le nom est long, plus on tolère d'erreurs d'écoute. Les noms courts doivent être exacts. */
const maxDistanceFor = (wordLength: number): number => {
  if (wordLength <= 5) return 0;
  if (wordLength <= 8) return 1;
  return 2;
};

const wordMatches = (heard: string, reference: string, excluded: ReadonlySet<string>): boolean => {
  if (heard === reference) return true;
  const maxDistance = maxDistanceFor(reference.length);
  if (maxDistance === 0 || excluded.has(heard)) return false;
  // Whisper se trompe rarement sur la première lettre ; l'exiger écarte beaucoup de faux positifs.
  if (!heard.startsWith(reference.charAt(0))) return false;
  if (Math.abs(heard.length - reference.length) > maxDistance) return false;
  return levenshtein(heard, reference) <= maxDistance;
};

const toWords = (name: string): string[] => tokenize(name).map((token) => token.normalized);

/** Prénom et surnoms, dédoublonnés ; un nom composé est aussi cherché en un seul mot (« jeanpierre »). */
const prepareTargets = (settings: NameDetectionSettings): NameTarget[] => {
  const seen = new Set<string>();
  const targets: NameTarget[] = [];
  for (const reference of [settings.listenerName, ...settings.nicknames]) {
    const words = toWords(reference);
    const variants = words.length > 1 ? [words, [words.join('')]] : [words];
    for (const variant of variants) {
      const key = variant.join(' ');
      if (variant.length === 0 || seen.has(key)) continue;
      seen.add(key);
      targets.push({ reference, words: variant });
    }
  }
  // Les noms les plus longs d'abord : « Mamie Jo » l'emporte sur « Mamie » pour les mêmes mots.
  return targets.sort((left, right) => right.words.length - left.words.length);
};

/** Mots qui ne doivent jamais passer pour une déformation du prénom : les autres convives et la parenté. */
const buildExcludedWords = (settings: NameDetectionSettings): Set<string> =>
  new Set([...KINSHIP_WORDS, ...settings.guestNames.flatMap(toWords)]);

const windowMatches = (
  window: readonly TextToken[],
  target: NameTarget,
  excluded: ReadonlySet<string>,
): boolean =>
  window.length === target.words.length &&
  window.every((token, index) => {
    const reference = target.words[index];
    return reference !== undefined && wordMatches(token.normalized, reference, excluded);
  });

/**
 * Détection déterministe du prénom de la personne et de ses surnoms (pas de LLM : il faut une
 * alerte immédiate). Comparaison sans casse, accents ni ponctuation, avec une tolérance
 * d'écoute proportionnelle à la longueur du nom. Les plages renvoyées portent sur le texte original.
 */
export class NameDetector implements INameDetector {
  detect(text: string, settings: NameDetectionSettings): readonly NameMatch[] {
    const tokens = tokenize(text);
    const excluded = buildExcludedWords(settings);
    const claimed = new Set<number>();
    const matches: NameMatch[] = [];

    for (const target of prepareTargets(settings)) {
      const size = target.words.length;
      for (let start = 0; start + size <= tokens.length; start += 1) {
        const indexes = Array.from({ length: size }, (_, offset) => start + offset);
        if (indexes.some((index) => claimed.has(index))) continue;
        const window = tokens.slice(start, start + size);
        const first = window[0];
        const last = window.at(-1);
        if (first === undefined || last === undefined) continue;
        if (!windowMatches(window, target, excluded)) continue;
        indexes.forEach((index) => claimed.add(index));
        matches.push({ name: target.reference, range: { start: first.start, end: last.end } });
      }
    }

    return matches.sort((left, right) => left.range.start - right.range.start);
  }
}
