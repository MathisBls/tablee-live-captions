import type { CaptionSegment } from '@tablee/shared';
import { describe, expect, it } from 'vitest';
import { createMentionAlert } from './table-session';
import { normalizeText, tokenize } from './text';
import { sanitizeTopicLabel, topicComparisonKey } from './topic-label';
import { cleanTranscript } from './transcript-cleaning';

const PROMPT = 'Repas de famille avec Paul, Inès, Léa et Mamie.';

describe('tokenize', () => {
  it('keeps positions in the original text and normalizes accents and case', () => {
    expect(tokenize("D'Inès, MAMIE !")).toEqual([
      { normalized: 'd', start: 0, end: 1 },
      { normalized: 'ines', start: 2, end: 6 },
      { normalized: 'mamie', start: 8, end: 13 },
    ]);
  });

  it('normalizes a whole sentence for comparison', () => {
    expect(normalizeText('  Sous-titres réalisés par… ')).toBe('sous titres realises par');
  });
});

describe('cleanTranscript', () => {
  it('keeps real speech, trimmed', () => {
    expect(cleanTranscript('  Bon, qui reprend du gratin ? ', PROMPT)).toBe(
      'Bon, qui reprend du gratin ?',
    );
  });

  it('drops the hallucination measured on room tone', () => {
    expect(cleanTranscript(' Merci.', PROMPT)).toBeNull();
    expect(cleanTranscript('Thank you.', PROMPT)).toBeNull();
  });

  it('drops classic subtitle credits wherever they appear', () => {
    expect(
      cleanTranscript("Sous-titres réalisés par la communauté d'Amara.org", PROMPT),
    ).toBeNull();
    expect(cleanTranscript("Merci d'avoir regardé cette vidéo !", PROMPT)).toBeNull();
    expect(cleanTranscript('Thanks for watching!', PROMPT)).toBeNull();
  });

  it('removes non-speech annotations and drops segments made only of them', () => {
    expect(cleanTranscript('[BLANK_AUDIO]', PROMPT)).toBeNull();
    expect(cleanTranscript('(rires) ♪', PROMPT)).toBeNull();
    expect(cleanTranscript('[Musique] On passe à table !', PROMPT)).toBe('On passe à table !');
  });

  it('drops an echo of the Whisper prompt but keeps a lone name', () => {
    expect(cleanTranscript('Paul, Inès, Léa.', PROMPT)).toBeNull();
    expect(cleanTranscript('Mamie !', PROMPT)).toBe('Mamie !');
  });

  it('drops empty and punctuation-only outputs', () => {
    expect(cleanTranscript('', PROMPT)).toBeNull();
    expect(cleanTranscript(' ... ', PROMPT)).toBeNull();
  });
});

describe('sanitizeTopicLabel', () => {
  it('removes quotes, prefixes, markdown and final punctuation', () => {
    expect(sanitizeTopicLabel('« Les vacances en Bretagne. »')).toBe('Les vacances en Bretagne');
    expect(sanitizeTopicLabel('Sujet : le match de Lens !')).toBe('Le match de Lens');
    expect(sanitizeTopicLabel('**Le nouveau travail de Paul**')).toBe('Le nouveau travail de Paul');
  });

  it('keeps only the first non-empty line', () => {
    expect(sanitizeTopicLabel('\n  Le gratin de Mamie\nC’est un plat familial.')).toBe(
      'Le gratin de Mamie',
    );
  });

  it('rejects answers that are too long, empty or explicitly topic-less', () => {
    expect(
      sanitizeTopicLabel('On parle de beaucoup de choses très différentes ce soir'),
    ).toBeNull();
    expect(sanitizeTopicLabel('  ')).toBeNull();
    expect(sanitizeTopicLabel('AUCUN')).toBeNull();
    expect(sanitizeTopicLabel('None.')).toBeNull();
  });

  it('compares topics without case, accents or punctuation', () => {
    expect(topicComparisonKey('Les vacances en Bretagne')).toBe(
      topicComparisonKey('les vacances en bretagne !'),
    );
  });
});

describe('createMentionAlert', () => {
  const segment: CaptionSegment = {
    id: '7d9f2c1e-4b8a-4e3f-9c2d-1a5b6c7d8e9f',
    text: 'Mamie Jo, Mamie, à table !',
    startedAt: 0,
    endedAt: 3000,
  };

  it('returns null without matches', () => {
    expect(createMentionAlert(segment, [], 10)).toBeNull();
  });

  it('builds one alert per segment, named after the first occurrence, with merged ranges', () => {
    const alert = createMentionAlert(
      segment,
      [
        { name: 'Mamie', range: { start: 10, end: 15 } },
        { name: 'Mamie Jo', range: { start: 0, end: 8 } },
        { name: 'Mamie', range: { start: 0, end: 5 } },
      ],
      10,
    );
    expect(alert).toEqual({
      segmentId: segment.id,
      matchedName: 'Mamie Jo',
      ranges: [
        { start: 0, end: 8 },
        { start: 10, end: 15 },
      ],
      at: 10,
    });
  });
});
