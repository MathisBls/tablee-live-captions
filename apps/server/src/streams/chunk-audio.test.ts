import { AUDIO_FRAME_BYTES, AUDIO_SAMPLE_RATE } from '@tablee/shared';
import { from, lastValueFrom, Subject, toArray } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { AudioSignal, PcmChunk } from '../interfaces';
import { chunkAudio, DEFAULT_CHUNK_OPTIONS } from './chunk-audio';
import { readFixturePcm } from '../../test/support/fixtures';

const FIXED_NOW = 1_000_000;
const options = { ...DEFAULT_CHUNK_OPTIONS, silenceRms: 0.01, now: (): number => FIXED_NOW };

/** Sinusoïde de 440 Hz (RMS ≈ 0,21) ou silence numérique. */
const synthesize = (durationMs: number, amplitude: number): Uint8Array => {
  const samples = Math.round((AUDIO_SAMPLE_RATE * durationMs) / 1000);
  const bytes = new Uint8Array(samples * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples; index += 1) {
    const value = amplitude * Math.sin((2 * Math.PI * 440 * index) / AUDIO_SAMPLE_RATE);
    view.setInt16(index * 2, Math.round(value * 32_767), true);
  }
  return bytes;
};

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
};

const toSignals = (pcm: Uint8Array, messageBytes: number = AUDIO_FRAME_BYTES): AudioSignal[] => {
  const signals: AudioSignal[] = [];
  for (let offset = 0; offset < pcm.byteLength; offset += messageBytes) {
    signals.push({ kind: 'frame', bytes: pcm.subarray(offset, offset + messageBytes) });
  }
  return signals;
};

const chunk = (signals: AudioSignal[]): Promise<PcmChunk[]> =>
  lastValueFrom(from(signals).pipe(chunkAudio(options), toArray()));

const tone = (durationMs: number): Uint8Array => synthesize(durationMs, 0.3);
const silence = (durationMs: number): Uint8Array => synthesize(durationMs, 0);

describe('chunkAudio', () => {
  it('never emits a window for room tone, even with an isolated click', async () => {
    expect(await chunk(toSignals(readFixturePcm('room-tone-silence.wav')))).toEqual([]);
  });

  it('cuts a real dinner conversation into speech windows of at most 6 s', async () => {
    const chunks = await chunk(toSignals(readFixturePcm('fr-dinner-mention.wav')));
    expect(chunks.length).toBeGreaterThanOrEqual(4);
    expect(chunks.length).toBeLessThanOrEqual(10);
    for (const window of chunks) {
      expect(window.durationMs).toBeLessThanOrEqual(DEFAULT_CHUNK_OPTIONS.maxWindowMs);
      expect(window.voicedMs).toBeGreaterThanOrEqual(DEFAULT_CHUNK_OPTIONS.minVoicedMs);
      expect(window.pcm.byteLength).toBe((window.durationMs / 100) * AUDIO_FRAME_BYTES);
    }
  });

  it('produces the same windows whatever the size of the incoming messages', async () => {
    const pcm = readFixturePcm('en-dinner-mention.wav');
    const byFrame = await chunk(toSignals(pcm));
    const grouped = await chunk(toSignals(pcm, AUDIO_FRAME_BYTES * 3));
    const unaligned = await chunk(toSignals(pcm, 1001));
    expect(grouped.map((window) => window.pcm)).toEqual(byFrame.map((window) => window.pcm));
    expect(unaligned.map((window) => window.pcm)).toEqual(byFrame.map((window) => window.pcm));
  });

  it('cuts early on a pause, keeping a short pre-roll before the speech', async () => {
    const [window, ...rest] = await chunk(
      toSignals(concat(silence(1000), tone(2000), silence(1000))),
    );
    expect(rest).toEqual([]);
    expect(window?.voicedMs).toBe(2000);
    expect(window?.durationMs).toBe(
      DEFAULT_CHUNK_OPTIONS.prerollMs + 2000 + DEFAULT_CHUNK_OPTIONS.pauseMs,
    );
  });

  it('forces a cut at the maximum window length during continuous speech', async () => {
    const chunks = await chunk(toSignals(tone(7000)));
    expect(chunks.map((window) => window.durationMs)).toEqual([6000, 1000]);
  });

  it('ignores bursts shorter than the minimum voiced duration', async () => {
    expect(await chunk(toSignals(concat(tone(200), silence(2000))))).toEqual([]);
  });

  it('emits the pending window on flush, with timestamps ending at the cut', () => {
    const audio = new Subject<AudioSignal>();
    const emitted: PcmChunk[] = [];
    const subscription = audio
      .pipe(chunkAudio(options))
      .subscribe((window) => emitted.push(window));
    toSignals(tone(1000)).forEach((signal) => {
      audio.next(signal);
    });
    expect(emitted).toEqual([]);
    audio.next({ kind: 'flush' });
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.endedAt).toBe(FIXED_NOW);
    expect(emitted[0]?.startedAt).toBe(FIXED_NOW - 1000);
    subscription.unsubscribe();
  });

  it('flushes the last window when the audio stream completes', async () => {
    const chunks = await chunk(toSignals(tone(1500)));
    expect(chunks.map((window) => window.durationMs)).toEqual([1500]);
  });
});
