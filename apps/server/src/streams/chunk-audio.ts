import { AUDIO_FRAME_BYTES, AUDIO_FRAME_MS } from '@tablee/shared';
import { Observable, type OperatorFunction } from 'rxjs';
import type { AudioSignal, ChunkAudioOptions, PcmChunk } from '../interfaces';
import { rootMeanSquare } from './pcm';

/** Réglages par défaut : fenêtre ~4 s coupée sur silence, 6 s max, pour rester sous 5 s de latence. */
export const DEFAULT_CHUNK_OPTIONS = {
  windowMs: 4000,
  maxWindowMs: 6000,
  pauseMs: 600,
  minPauseWindowMs: 1500,
  minVoicedMs: 300,
  prerollMs: 300,
} as const;

const concatFrames = (frames: readonly Uint8Array[]): Uint8Array<ArrayBuffer> => {
  const pcm = new Uint8Array(frames.length * AUDIO_FRAME_BYTES);
  frames.forEach((frame, index) => {
    pcm.set(frame, index * AUDIO_FRAME_BYTES);
  });
  return pcm;
};

/**
 * Découpe un flux de trames PCM en fenêtres de parole. Les messages reçus sont redécoupés en trames
 * d'analyse de 100 ms, quelle que soit leur taille. Une trame est « voisée » si son RMS dépasse le seuil.
 */
class AudioWindowAccumulator {
  private carry = new Uint8Array(0);
  private frames: Uint8Array[] = [];
  private voicedFrames = 0;
  private trailingSilentFrames = 0;

  constructor(private readonly options: ChunkAudioOptions) {}

  accept(signal: AudioSignal): PcmChunk[] {
    if (signal.kind === 'flush') {
      const chunk = this.cut();
      return chunk === null ? [] : [chunk];
    }
    const chunks: PcmChunk[] = [];
    for (const frame of this.splitIntoFrames(signal.bytes)) {
      const chunk = this.acceptFrame(frame);
      if (chunk !== null) chunks.push(chunk);
    }
    return chunks;
  }

  flush(): PcmChunk | null {
    return this.cut();
  }

  private splitIntoFrames(bytes: Uint8Array): Uint8Array[] {
    const buffer = new Uint8Array(this.carry.byteLength + bytes.byteLength);
    buffer.set(this.carry, 0);
    buffer.set(bytes, this.carry.byteLength);
    const frames: Uint8Array[] = [];
    let offset = 0;
    for (; offset + AUDIO_FRAME_BYTES <= buffer.byteLength; offset += AUDIO_FRAME_BYTES) {
      frames.push(buffer.slice(offset, offset + AUDIO_FRAME_BYTES));
    }
    this.carry = buffer.slice(offset);
    return frames;
  }

  private acceptFrame(frame: Uint8Array): PcmChunk | null {
    const voiced = rootMeanSquare(frame) >= this.options.silenceRms;
    if (!voiced && this.voicedFrames === 0) {
      this.keepPreroll(frame);
      return null;
    }
    this.frames.push(frame);
    if (voiced) {
      this.voicedFrames += 1;
      this.trailingSilentFrames = 0;
    } else {
      this.trailingSilentFrames += 1;
    }
    return this.shouldCut(voiced) ? this.cut() : null;
  }

  private keepPreroll(frame: Uint8Array): void {
    this.frames.push(frame);
    const maxPrerollFrames = Math.floor(this.options.prerollMs / AUDIO_FRAME_MS);
    while (this.frames.length > maxPrerollFrames) this.frames.shift();
  }

  private shouldCut(voiced: boolean): boolean {
    const durationMs = this.frames.length * AUDIO_FRAME_MS;
    if (durationMs >= this.options.maxWindowMs) return true;
    if (!voiced && durationMs >= this.options.windowMs) return true;
    const pauseMs = this.trailingSilentFrames * AUDIO_FRAME_MS;
    return pauseMs >= this.options.pauseMs && durationMs >= this.options.minPauseWindowMs;
  }

  private cut(): PcmChunk | null {
    const voicedMs = this.voicedFrames * AUDIO_FRAME_MS;
    const durationMs = this.frames.length * AUDIO_FRAME_MS;
    const pcm = concatFrames(this.frames);
    this.frames = [];
    this.voicedFrames = 0;
    this.trailingSilentFrames = 0;
    if (voicedMs < this.options.minVoicedMs) return null;
    const endedAt = this.options.now();
    return { pcm, durationMs, voicedMs, startedAt: endedAt - durationMs, endedAt };
  }
}

/**
 * Opérateur : signaux audio d'une session → fenêtres de parole prêtes pour Whisper.
 * Les fenêtres sans assez de parole (silence, bruit de fond, clic isolé) ne sortent jamais.
 */
export const chunkAudio =
  (options: ChunkAudioOptions): OperatorFunction<AudioSignal, PcmChunk> =>
  (source) =>
    new Observable<PcmChunk>((subscriber) => {
      const accumulator = new AudioWindowAccumulator(options);
      return source.subscribe({
        next: (signal) => {
          for (const chunk of accumulator.accept(signal)) subscriber.next(chunk);
        },
        error: (error: unknown) => {
          subscriber.error(error);
        },
        complete: () => {
          const lastChunk = accumulator.flush();
          if (lastChunk !== null) subscriber.next(lastChunk);
          subscriber.complete();
        },
      });
    });
