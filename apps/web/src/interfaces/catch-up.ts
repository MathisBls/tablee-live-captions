import type { AiStreamEvent } from '@tablee/shared';
import type { ClientErrorCode } from './api';

export type CatchUpPhase = 'thinking' | 'streaming' | 'done' | 'insufficient' | 'error';

/** Gemma peut mettre jusqu'à une minute au premier appel (chargement du modèle) : on rassure par paliers. */
export type CatchUpPatience = 'normal' | 'slow' | 'very_slow';

export interface CatchUpState {
  readonly phase: CatchUpPhase;
  readonly text: string;
  readonly patience: CatchUpPatience;
  readonly errorCode: ClientErrorCode | null;
}

export type CatchUpEvent =
  | AiStreamEvent
  | { readonly type: 'patience'; readonly patience: Exclude<CatchUpPatience, 'normal'> }
  | { readonly type: 'failed'; readonly code: ClientErrorCode };
