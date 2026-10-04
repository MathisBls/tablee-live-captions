import type { Language } from '@tablee/shared';
import type { Observable } from 'rxjs';

export interface TranscriptionRequest {
  /** Fichier WAV complet (PCM16 mono 16 kHz). */
  readonly wav: Uint8Array<ArrayBuffer>;
  readonly language: Language;
  /** Texte d'amorce pour Whisper : les prénoms y sont, pour qu'il les orthographie correctement. */
  readonly prompt: string;
  /** Par défaut celui de la configuration ; le préchauffage a besoin de beaucoup plus. */
  readonly timeoutMs?: number;
}

export interface ITranscriber {
  /** Texte brut reconnu, une seule émission. Se désabonner annule la requête HTTP en cours. */
  transcribe(request: TranscriptionRequest): Observable<string>;
}
