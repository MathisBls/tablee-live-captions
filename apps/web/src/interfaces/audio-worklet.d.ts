/*
 * Globaux de l'AudioWorkletGlobalScope, absents de lib DOM.
 * Utilisés uniquement par services/audio/pcm-worklet.ts.
 */
declare const sampleRate: number;

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorConstructor: new () => AudioWorkletProcessor,
): void;
