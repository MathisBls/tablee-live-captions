import type { FastifyReply } from 'fastify';
import { ok } from '../http';
import { toSessionDto } from '../models';
import type { CreateSessionRequest, ISessionService, SessionRequest } from '../interfaces';

export class SessionsController {
  constructor(private readonly sessions: ISessionService) {}

  create = async (request: CreateSessionRequest, reply: FastifyReply): Promise<void> => {
    const session = this.sessions.create(request.body);
    await reply.code(201).send(ok(toSessionDto(session)));
  };

  get = async (request: SessionRequest, reply: FastifyReply): Promise<void> => {
    const session = this.sessions.get(request.params.sessionId);
    await reply.send(ok(toSessionDto(session)));
  };

  end = async (request: SessionRequest, reply: FastifyReply): Promise<void> => {
    this.sessions.end(request.params.sessionId);
    await reply.code(204).send();
  };
}
