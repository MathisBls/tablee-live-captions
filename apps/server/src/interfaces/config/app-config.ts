export type RuntimeEnvironment = 'development' | 'production' | 'test';

export type LogLevelName = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface OllamaConfig {
  readonly url: string;
  readonly model: string;
  readonly numCtx: number;
  /** Durée de maintien du modèle en mémoire après une requête (format Ollama, ex. `4h`). */
  readonly keepAlive: string;
  /** Délai max avant le premier token, puis entre deux tokens. */
  readonly timeoutMs: number;
}

export interface WhisperConfig {
  readonly url: string;
  readonly timeoutMs: number;
}

export interface SessionsConfig {
  readonly ttlMinutes: number;
  readonly maxSessions: number;
  readonly maxEventClientsPerSession: number;
}

export interface AudioConfig {
  /** RMS normalisé (0..1) sous lequel une trame de 100 ms est considérée comme du silence. */
  readonly silenceRms: number;
}

export interface AppConfig {
  readonly environment: RuntimeEnvironment;
  readonly host: string;
  readonly port: number;
  readonly corsOrigins: readonly string[];
  readonly logLevel: LogLevelName;
  readonly ollama: OllamaConfig;
  readonly whisper: WhisperConfig;
  readonly sessions: SessionsConfig;
  readonly audio: AudioConfig;
}
