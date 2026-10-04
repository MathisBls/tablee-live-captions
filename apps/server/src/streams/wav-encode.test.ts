import { describe, expect, it } from 'vitest';
import { extractPcm, readFixtureFile } from '../../test/support/fixtures';
import { encodeWav, WAV_HEADER_BYTES } from './wav-encode';

const ascii = (bytes: Uint8Array, start: number, length: number): string =>
  String.fromCharCode(...bytes.subarray(start, start + length));

describe('encodeWav', () => {
  it('writes a canonical 44-byte RIFF header for PCM16 mono 16 kHz', () => {
    const pcm = new Uint8Array([1, 0, 255, 127, 0, 128]);
    const wav = encodeWav(pcm);
    const view = new DataView(wav.buffer);

    expect(wav.byteLength).toBe(WAV_HEADER_BYTES + pcm.byteLength);
    expect(ascii(wav, 0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + pcm.byteLength);
    expect(ascii(wav, 8, 4)).toBe('WAVE');
    expect(ascii(wav, 12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint32(28, true)).toBe(32_000);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(wav, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(pcm.byteLength);
    expect([...wav.subarray(WAV_HEADER_BYTES)]).toEqual([...pcm]);
  });

  it('rebuilds a fixture with the same format chunk and the same samples', () => {
    const fixture = readFixtureFile('room-tone-silence.wav');
    const samples = extractPcm(fixture);
    const rebuilt = encodeWav(samples);
    expect([...rebuilt.subarray(12, 36)]).toEqual([...fixture.subarray(12, 36)]);
    expect([...extractPcm(rebuilt)]).toEqual([...samples]);
  });

  it('encodes an empty buffer as a header-only file', () => {
    const wav = encodeWav(new Uint8Array(0));
    expect(wav.byteLength).toBe(WAV_HEADER_BYTES);
    expect(new DataView(wav.buffer).getUint32(40, true)).toBe(0);
  });
});
