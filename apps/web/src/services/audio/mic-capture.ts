import { AUDIO_BYTES_PER_SAMPLE, AUDIO_FRAME_BYTES, AUDIO_SAMPLE_RATE } from '@tablee/shared';
import { Observable } from 'rxjs';
import { z } from 'zod';
import type { MicFailure, MicSignal, PcmFrameMessage, PcmWorkletOptions } from '@/interfaces/audio';
import workletUrl from './pcm-worklet.ts?worker&url';
import { PCM_PROCESSOR_NAME } from './worklet-protocol';

const pcmFrameMessageSchema: z.ZodType<PcmFrameMessage> = z.object({
  frame: z.instanceof(ArrayBuffer),
  level: z.number().nonnegative(),
});

const workletOptions: PcmWorkletOptions = {
  targetSampleRate: AUDIO_SAMPLE_RATE,
  frameSamples: AUDIO_FRAME_BYTES / AUDIO_BYTES_PER_SAMPLE,
};

// Toute la table parle de loin : la suppression de bruit des navigateurs, réglée pour une voix
// proche du micro, efface les convives éloignés. Le gain automatique, lui, les rapproche.
const tableMicrophone: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
  },
};

function failureOf(error: unknown): MicFailure {
  if (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'SecurityError')
  ) {
    return 'denied';
  }
  return 'unavailable';
}

/**
 * Capture le micro en trames PCM16 mono 16 kHz de 100 ms, avec leur niveau RMS.
 * Se désabonner coupe les pistes du micro et ferme l'AudioContext.
 */
export function captureMicrophone(): Observable<MicSignal> {
  return new Observable<MicSignal>((subscriber) => {
    subscriber.next({ type: 'starting' });
    if (!window.isSecureContext) {
      subscriber.next({ type: 'failed', reason: 'insecure' });
      subscriber.complete();
      return undefined;
    }

    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let released = false;
    // Lu à travers une fonction : TypeScript ne voit pas que `release` peut passer entre deux await.
    const isReleased = (): boolean => released;

    // Après un rechargement, le navigateur garde l'audio en pause jusqu'au premier geste.
    const resumeOnGesture = (): void => {
      void context?.resume();
    };

    const reportState = (): void => {
      if (context?.state === 'running') {
        subscriber.next({ type: 'listening' });
      } else if (context?.state === 'suspended') {
        subscriber.next({ type: 'suspended' });
      }
    };

    const release = (): void => {
      released = true;
      document.removeEventListener('pointerdown', resumeOnGesture);
      document.removeEventListener('keydown', resumeOnGesture);
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
      if (context !== null && context.state !== 'closed') {
        context.onstatechange = null;
        void context.close();
      }
    };

    const start = async (): Promise<void> => {
      stream = await navigator.mediaDevices.getUserMedia(tableMicrophone);
      if (isReleased()) {
        release();
        return;
      }
      const audioContext = new AudioContext();
      context = audioContext;
      await audioContext.audioWorklet.addModule(workletUrl);
      if (isReleased()) {
        release();
        return;
      }
      const source = audioContext.createMediaStreamSource(stream);
      const processor = new AudioWorkletNode(audioContext, PCM_PROCESSOR_NAME, {
        processorOptions: workletOptions,
      });
      processor.port.onmessage = (event: MessageEvent<unknown>) => {
        const parsed = pcmFrameMessageSchema.safeParse(event.data);
        if (parsed.success) {
          subscriber.next({ type: 'frame', pcm: parsed.data.frame, level: parsed.data.level });
        }
      };
      source.connect(processor);
      // Relié à la sortie pour que le navigateur fasse tourner le worklet ; il n'écrit que du silence.
      processor.connect(audioContext.destination);
      audioContext.onstatechange = reportState;
      document.addEventListener('pointerdown', resumeOnGesture);
      document.addEventListener('keydown', resumeOnGesture);
      reportState();
    };

    start().catch((error: unknown) => {
      if (!isReleased()) {
        subscriber.next({ type: 'failed', reason: failureOf(error) });
        subscriber.complete();
      }
    });

    return release;
  });
}
