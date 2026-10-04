/** Ce qui entre dans le pipeline audio d'une session. */
export type AudioSignal =
  | { readonly kind: 'frame'; readonly bytes: Uint8Array }
  /** Le micro s'est arrêté : la fenêtre en cours part tout de suite au lieu d'attendre la suite. */
  | { readonly kind: 'flush' };

/** Une fenêtre de parole prête à transcrire. */
export interface PcmChunk {
  /** PCM16 little-endian mono 16 kHz, sans en-tête. */
  readonly pcm: Uint8Array<ArrayBuffer>;
  readonly durationMs: number;
  readonly voicedMs: number;
  readonly startedAt: number;
  /** Instant où la fenêtre a été coupée : point de départ de la mesure de latence. */
  readonly endedAt: number;
}

export interface ChunkAudioOptions {
  readonly silenceRms: number;
  /** Durée visée d'une fenêtre : passé ce cap, on coupe au premier silence. */
  readonly windowMs: number;
  /** Coupe forcée, même en pleine phrase. */
  readonly maxWindowMs: number;
  /** Une pause de cette durée termine la fenêtre plus tôt, si elle dure déjà `minPauseWindowMs`. */
  readonly pauseMs: number;
  readonly minPauseWindowMs: number;
  /** En dessous, la fenêtre n'est que du bruit : elle n'est jamais envoyée à Whisper. */
  readonly minVoicedMs: number;
  /** Silence conservé avant la parole, pour ne pas couper la première syllabe. */
  readonly prerollMs: number;
  readonly now: () => number;
}

export interface RetryWithBackoffOptions {
  readonly count: number;
  readonly baseDelayMs: number;
}
