import type { PcmFrameMessage, PcmWorkletOptions } from '@/interfaces/audio';
import { PCM_PROCESSOR_NAME } from './worklet-protocol';

/*
 * Tourne dans l'AudioWorkletGlobalScope : pas de DOM, pas de dépendances lourdes. Le format cible
 * (16 kHz, trames de 100 ms) arrive par `processorOptions` depuis le thread principal, qui le lit
 * dans le contrat partagé.
 */

function readOptions(raw: unknown): PcmWorkletOptions {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'targetSampleRate' in raw &&
    'frameSamples' in raw &&
    typeof raw.targetSampleRate === 'number' &&
    typeof raw.frameSamples === 'number'
  ) {
    return { targetSampleRate: raw.targetSampleRate, frameSamples: raw.frameSamples };
  }
  throw new Error('Invalid processorOptions for the PCM worklet');
}

class PcmFrameProcessor extends AudioWorkletProcessor {
  private readonly decimationRatio: number;
  private readonly frameSamples: number;
  private frame: DataView<ArrayBuffer>;
  private frameLength = 0;
  private squareSum = 0;
  private bucketSum = 0;
  private bucketCount = 0;
  private bucketProgress = 0;

  constructor(options: WorkletProcessorConstructionOptions) {
    super();
    const { targetSampleRate, frameSamples } = readOptions(options.processorOptions);
    this.decimationRatio = sampleRate / targetSampleRate;
    this.frameSamples = frameSamples;
    this.frame = new DataView(new ArrayBuffer(frameSamples * 2));
  }

  override process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel !== undefined) {
      for (const sample of channel) {
        this.accumulate(sample);
      }
    }
    return true;
  }

  // Décimation par moyenne de chaque paquet d'échantillons : un passe-bas grossier, suffisant pour
  // la voix, qui gère aussi les rapports non entiers (44,1 kHz → 16 kHz).
  private accumulate(sample: number): void {
    this.bucketSum += sample;
    this.bucketCount += 1;
    this.bucketProgress += 1;
    if (this.bucketProgress >= this.decimationRatio) {
      this.bucketProgress -= this.decimationRatio;
      this.pushSample(this.bucketSum / this.bucketCount);
      this.bucketSum = 0;
      this.bucketCount = 0;
    }
  }

  private pushSample(value: number): void {
    const clamped = Math.max(-1, Math.min(1, value));
    const pcm16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    this.frame.setInt16(this.frameLength * 2, pcm16, true);
    this.squareSum += clamped * clamped;
    this.frameLength += 1;
    if (this.frameLength === this.frameSamples) {
      this.flushFrame();
    }
  }

  private flushFrame(): void {
    const buffer = this.frame.buffer;
    const message: PcmFrameMessage = {
      frame: buffer,
      level: Math.sqrt(this.squareSum / this.frameSamples),
    };
    this.port.postMessage(message, [buffer]);
    this.frame = new DataView(new ArrayBuffer(this.frameSamples * 2));
    this.frameLength = 0;
    this.squareSum = 0;
  }
}

registerProcessor(PCM_PROCESSOR_NAME, PcmFrameProcessor);
