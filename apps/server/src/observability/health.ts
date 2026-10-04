import type { ReadinessDto } from '@tablee/shared';
import type { IDependencyProbe, IReadinessService } from '../interfaces';

/** /ready : Ollama (avec le modèle configuré) et whisper-server joignables. */
export class ReadinessService implements IReadinessService {
  constructor(
    private readonly probes: {
      readonly llm: IDependencyProbe;
      readonly transcriber: IDependencyProbe;
    },
  ) {}

  async check(): Promise<ReadinessDto> {
    const [llm, transcriber] = await Promise.all([
      this.probes.llm.isAvailable(),
      this.probes.transcriber.isAvailable(),
    ]);
    return {
      ready: llm && transcriber,
      dependencies: { llm: llm ? 'up' : 'down', transcriber: transcriber ? 'up' : 'down' },
    };
  }
}
