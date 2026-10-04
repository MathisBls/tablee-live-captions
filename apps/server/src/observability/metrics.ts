import type {
  CounterName,
  HistogramName,
  HistogramSnapshot,
  IMetrics,
  MetricsSnapshot,
} from '../interfaces';

const COUNTER_NAMES: readonly CounterName[] = [
  'audio.frames_received',
  'audio.chunks_emitted',
  'audio.chunks_dropped_stale',
  'transcriber.segments',
  'transcriber.hallucinations_filtered',
  'transcriber.failures',
  'llm.requests',
  'llm.failures',
  'mentions.detected',
  'topics.updated',
];

const HISTOGRAM_NAMES: readonly HistogramName[] = [
  'http.request_ms',
  'transcriber.request_ms',
  'pipeline.window_to_caption_ms',
  'llm.first_token_ms',
  'llm.total_ms',
];

/** Les percentiles portent sur les derniers échantillons seulement : c'est la latence actuelle qui compte. */
const MAX_SAMPLES_PER_HISTOGRAM = 500;

const percentile = (sortedValues: readonly number[], ratio: number): number => {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil(ratio * sortedValues.length) - 1);
  return sortedValues[Math.max(0, index)] ?? 0;
};

const summarize = (samples: readonly number[]): HistogramSnapshot => {
  const sorted = [...samples].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  return {
    count: sorted.length,
    averageMs: sorted.length === 0 ? 0 : Math.round(total / sorted.length),
    p50Ms: Math.round(percentile(sorted, 0.5)),
    p95Ms: Math.round(percentile(sorted, 0.95)),
    maxMs: Math.round(sorted.at(-1) ?? 0),
  };
};

export class InMemoryMetrics implements IMetrics {
  private readonly startedAt: number;
  private readonly counters = new Map<CounterName, number>();
  private readonly samples = new Map<HistogramName, number[]>();

  constructor(private readonly now: () => number = Date.now) {
    this.startedAt = now();
  }

  increment(name: CounterName, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  observe(name: HistogramName, valueMs: number): void {
    const values = this.samples.get(name) ?? [];
    values.push(valueMs);
    if (values.length > MAX_SAMPLES_PER_HISTOGRAM) values.shift();
    this.samples.set(name, values);
  }

  snapshot(): MetricsSnapshot {
    return {
      uptimeSeconds: Math.round((this.now() - this.startedAt) / 1000),
      counters: Object.fromEntries(
        COUNTER_NAMES.map((name) => [name, this.counters.get(name) ?? 0]),
      ),
      histograms: Object.fromEntries(
        HISTOGRAM_NAMES.map((name) => [name, summarize(this.samples.get(name) ?? [])]),
      ),
    };
  }
}
