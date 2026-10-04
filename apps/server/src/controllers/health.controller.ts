import type { FastifyReply } from 'fastify';
import { ok } from '../http';
import type { IMetrics, IReadinessService } from '../interfaces';

export class HealthController {
  constructor(
    private readonly readiness: IReadinessService,
    private readonly metrics: IMetrics,
  ) {}

  health = async (_request: unknown, reply: FastifyReply): Promise<void> => {
    await reply.send(ok({ status: 'ok' }));
  };

  ready = async (_request: unknown, reply: FastifyReply): Promise<void> => {
    const readiness = await this.readiness.check();
    await reply.code(readiness.ready ? 200 : 503).send(ok(readiness));
  };

  snapshotMetrics = async (_request: unknown, reply: FastifyReply): Promise<void> => {
    await reply.send(ok(this.metrics.snapshot()));
  };
}
