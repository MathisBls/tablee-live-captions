import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { SessionParams, SessionSettings } from '@tablee/shared';

export type App = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>;

export type SessionRequest = FastifyRequest<{ Params: SessionParams }>;

export type CreateSessionRequest = FastifyRequest<{ Body: SessionSettings }>;

export interface DataResponse<TData> {
  readonly data: TData;
}
