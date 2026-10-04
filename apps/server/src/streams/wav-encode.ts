import { AUDIO_BYTES_PER_SAMPLE, AUDIO_SAMPLE_RATE } from '@tablee/shared';

export const WAV_HEADER_BYTES = 44;

const PCM_FORMAT = 1;
const MONO = 1;
const FMT_CHUNK_BYTES = 16;

const writeAscii = (view: DataView, offset: number, text: string): void => {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
};

/** Enveloppe du PCM16 little-endian mono dans un fichier WAV (en-tête RIFF canonique de 44 octets). */
export const encodeWav = (
  pcm: Uint8Array,
  sampleRate: number = AUDIO_SAMPLE_RATE,
): Uint8Array<ArrayBuffer> => {
  const wav = new Uint8Array(WAV_HEADER_BYTES + pcm.byteLength);
  const view = new DataView(wav.buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, WAV_HEADER_BYTES - 8 + pcm.byteLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, FMT_CHUNK_BYTES, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, MONO, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * MONO * AUDIO_BYTES_PER_SAMPLE, true);
  view.setUint16(32, MONO * AUDIO_BYTES_PER_SAMPLE, true);
  view.setUint16(34, AUDIO_BYTES_PER_SAMPLE * 8, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  wav.set(pcm, WAV_HEADER_BYTES);
  return wav;
};
