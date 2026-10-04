export type CounterName =
  | 'audio.frames_received'
  | 'audio.chunks_emitted'
  | 'audio.chunks_dropped_stale'
  | 'transcriber.segments'
  | 'transcriber.hallucinations_filtered'
  | 'transcriber.failures'
  | 'llm.requests'
  | 'llm.failures'
  | 'mentions.detected'
  | 'topics.updated';

export type HistogramName =
  | 'http.request_ms'
  | 'transcriber.request_ms'
  | 'pipeline.window_to_caption_ms'
  | 'llm.first_token_ms'
  | 'llm.total_ms';

export interface HistogramSnapshot {
  readonly count: number;
  readonly averageMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly maxMs: number;
}

export interface MetricsSnapshot {
  readonly uptimeSeconds: number;
  readonly counters: Readonly<Record<string, number>>;
  readonly histograms: Readonly<Record<string, HistogramSnapshot>>;
}

export interface IMetrics {
  increment(name: CounterName, by?: number): void;
  observe(name: HistogramName, valueMs: number): void;
  snapshot(): MetricsSnapshot;
}
