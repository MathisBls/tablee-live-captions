import type { Observable } from 'rxjs';

export type MicFailure = 'denied' | 'unavailable' | 'insecure';

export type MicSignal =
  | { readonly type: 'listening' }
  /** Le navigateur attend un geste de l'utilisateur avant de laisser l'audio démarrer. */
  | { readonly type: 'suspended' }
  | { readonly type: 'frame'; readonly pcm: ArrayBuffer; readonly level: number }
  | { readonly type: 'failed'; readonly reason: MicFailure };

export type MicStatus = 'starting' | 'listening' | 'suspended' | MicFailure;

export type LinkStatus = 'connecting' | 'live' | 'reconnecting' | 'ended';

export interface AudioStatus {
  readonly mic: MicStatus;
  readonly link: LinkStatus;
}

export interface TableAudio {
  readonly status$: Observable<AudioStatus>;
  /** Niveau RMS de chaque trame de 100 ms, entre 0 et 1. */
  readonly level$: Observable<number>;
  readonly restart: () => void;
}

/** Message posté par le worklet audio vers le thread principal. */
export interface PcmFrameMessage {
  readonly frame: ArrayBuffer;
  readonly level: number;
}
