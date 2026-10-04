import { AUDIO_BYTES_PER_SAMPLE, AUDIO_SAMPLE_RATE } from '@tablee/shared';

const INT16_FULL_SCALE = 32_768;

/** RMS normalisé (0 = silence numérique, 1 = pleine échelle) d'un bloc PCM16 little-endian. */
export const rootMeanSquare = (pcm: Uint8Array): number => {
  const sampleCount = Math.floor(pcm.byteLength / AUDIO_BYTES_PER_SAMPLE);
  if (sampleCount === 0) return 0;
  const view = new DataView(pcm.buffer, pcm.byteOffset, sampleCount * AUDIO_BYTES_PER_SAMPLE);
  let sumOfSquares = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = view.getInt16(index * AUDIO_BYTES_PER_SAMPLE, true) / INT16_FULL_SCALE;
    sumOfSquares += sample * sample;
  }
  return Math.sqrt(sumOfSquares / sampleCount);
};

/** Silence numérique de la durée demandée (sert au préchauffage de Whisper). */
export const createSilence = (durationMs: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array(Math.round((AUDIO_SAMPLE_RATE * durationMs) / 1000) * AUDIO_BYTES_PER_SAMPLE);
