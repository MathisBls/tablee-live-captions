import { describe, expect, it } from 'vitest';
import { NameDetector } from './name-detector';

const detector = new NameDetector();

const settings = (
  listenerName: string,
  nicknames: string[] = [],
  guestNames: string[] = [],
): { listenerName: string; nicknames: string[]; guestNames: string[] } => ({
  listenerName,
  nicknames,
  guestNames,
});

const highlighted = (text: string, listener: ReturnType<typeof settings>): string[] =>
  detector.detect(text, listener).map((match) => text.slice(match.range.start, match.range.end));

describe('NameDetector', () => {
  it('finds the listener name regardless of case and punctuation', () => {
    const text = 'Bon, MAMIE, tu reprends du gratin ?';
    const matches = detector.detect(text, settings('Mamie'));
    expect(matches).toEqual([{ name: 'Mamie', range: { start: 5, end: 10 } }]);
  });

  it('ignores accents on both sides and returns ranges in the original text', () => {
    const text = "C'est la recette d'Inès, non ?";
    expect(highlighted(text, settings('Ines'))).toEqual(['Inès']);
    expect(highlighted('Ines, tu viens ?', settings('Inès'))).toEqual(['Ines']);
  });

  it('handles decomposed accents (NFD) from the recognizer', () => {
    const text = 'Léa, tu viens ?';
    expect(highlighted(text, settings('Léa'))).toEqual(['Léa']);
  });

  it('reports every occurrence, sorted by position', () => {
    const text = 'Mamie ! Mamie, tu viendrais avec nous ?';
    const matches = detector.detect(text, settings('Mamie'));
    expect(matches.map((match) => match.range)).toEqual([
      { start: 0, end: 5 },
      { start: 8, end: 13 },
    ]);
  });

  it('matches nicknames and reports the configured reference form', () => {
    const matches = detector.detect('Merci mamounette !', settings('Jeanne', ['Mamounette']));
    expect(matches).toEqual([{ name: 'Mamounette', range: { start: 6, end: 16 } }]);
  });

  it('matches multi-word nicknames as a single range', () => {
    const text = 'Tu en penses quoi, Mamie Jo ?';
    expect(highlighted(text, settings('Jeanne', ['Mamie Jo']))).toEqual(['Mamie Jo']);
  });

  it('prefers the longest nickname when two of them overlap', () => {
    const text = 'Mamie Jo, à table !';
    const matches = detector.detect(text, settings('Jeanne', ['Mamie', 'Mamie Jo']));
    expect(matches).toEqual([{ name: 'Mamie Jo', range: { start: 0, end: 8 } }]);
  });

  it('matches hyphenated names written with a space, a hyphen or glued', () => {
    const listener = settings('Jean-Pierre');
    expect(highlighted('Salut Jean Pierre', listener)).toEqual(['Jean Pierre']);
    expect(highlighted('Salut Jean-Pierre', listener)).toEqual(['Jean-Pierre']);
    expect(highlighted('Salut Jeanpierre', listener)).toEqual(['Jeanpierre']);
  });

  it('finds the name in possessives and elisions', () => {
    expect(highlighted("That's Grandpa's chair", settings('Grandpa'))).toEqual(['Grandpa']);
    expect(highlighted("C'est l'idée d'Inès", settings('Inès'))).toEqual(['Inès']);
  });

  it('requires an exact match for short names', () => {
    expect(detector.detect('Joe is here', settings('Jo'))).toEqual([]);
    expect(detector.detect('Mamy, tu viens ?', settings('Mamie'))).toEqual([]);
    expect(detector.detect('Pauline arrive', settings('Paul'))).toEqual([]);
  });

  it('tolerates one recognition error on medium names', () => {
    expect(highlighted('Bonjour Clemance', settings('Clémence'))).toEqual(['Clemance']);
    expect(highlighted('Merci Mathilda', settings('Mathilde'))).toEqual(['Mathilda']);
  });

  it('tolerates two recognition errors on long names', () => {
    expect(highlighted('Bravo Gwendolyne', settings('Gwendoline'))).toEqual(['Gwendolyne']);
    expect(highlighted('Bravo Maximiliem', settings('Maximilien'))).toEqual(['Maximiliem']);
  });

  it('never confuses kinship words that differ by one letter', () => {
    expect(detector.detect('Grandma, more gravy?', settings('Grandpa'))).toEqual([]);
    expect(detector.detect('Grandpa, more gravy?', settings('Grandma'))).toEqual([]);
  });

  it('never mistakes a guest for the listener', () => {
    expect(detector.detect('Martine, tu viens ?', settings('Martin', [], ['Martine']))).toEqual([]);
    expect(highlighted('Martin, tu viens ?', settings('Martin', [], ['Martine']))).toEqual([
      'Martin',
    ]);
  });

  it('requires the first letter to match before allowing a fuzzy match', () => {
    expect(detector.detect('Bernard est là', settings('Gernard'))).toEqual([]);
  });

  it('does not match inside longer words', () => {
    expect(detector.detect('Les mamies du quartier', settings('Mamie'))).toEqual([]);
    expect(detector.detect('Paulette est arrivée', settings('Paul'))).toEqual([]);
  });

  it('returns nothing for an empty text or a name made of punctuation only', () => {
    expect(detector.detect('', settings('Mamie'))).toEqual([]);
    expect(detector.detect('Bonjour à tous', settings('!!!'))).toEqual([]);
  });

  it('detects the mentions of the dinner fixtures transcripts', () => {
    const french =
      "Moi ! Il est délicieux, c'est la recette de Mamie ? Au fait, vous partez où cet été ? Mamie, tu viendrais avec nous en Bretagne ?";
    expect(detector.detect(french, settings('Mamie', [], ['Paul', 'Inès', 'Léa']))).toHaveLength(2);
    const english = 'Sure. Grandpa, do you want some more gravy?';
    expect(detector.detect(english, settings('Grandpa', [], ['Lily']))).toHaveLength(1);
  });
});
