import { readFileSync } from 'node:fs';
import { z } from 'zod';

const FIXTURES_DIRECTORY = new URL('../fixtures/audio/', import.meta.url);
const RIFF_HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;

const fixtureSchema = z.object({
  file: z.string(),
  language: z.enum(['fr', 'en']),
  listenerName: z.string(),
  guestNames: z.array(z.string()),
  transcript: z.string(),
  expectedMentions: z.number().int().nonnegative(),
  expectedKeywords: z.array(z.string()),
});

const manifestSchema = z.object({ fixtures: z.array(fixtureSchema) });

export const loadFixtures = (): z.infer<typeof fixtureSchema>[] =>
  manifestSchema.parse(
    JSON.parse(readFileSync(new URL('fixtures.json', FIXTURES_DIRECTORY), 'utf8')),
  ).fixtures;

export const readFixtureFile = (file: string): Buffer =>
  readFileSync(new URL(file, FIXTURES_DIRECTORY));

/** Échantillons PCM du chunk `data` (les fixtures contiennent aussi un chunk `LIST` avant). */
export const extractPcm = (wav: Uint8Array): Uint8Array => {
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  let offset = RIFF_HEADER_BYTES;
  while (offset + CHUNK_HEADER_BYTES <= wav.byteLength) {
    const id = String.fromCharCode(...wav.subarray(offset, offset + 4));
    const size = view.getUint32(offset + 4, true);
    const start = offset + CHUNK_HEADER_BYTES;
    if (id === 'data') return wav.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  throw new Error('WAV file without a data chunk');
};

export const readFixturePcm = (file: string): Uint8Array => extractPcm(readFixtureFile(file));
