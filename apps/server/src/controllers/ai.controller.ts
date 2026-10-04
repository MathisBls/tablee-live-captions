import type { FastifyReply } from 'fastify';
import { sendServerSentEvents } from '../http';
import type { IAssistantService, ISessionService, SessionRequest } from '../interfaces';

export class AiController {
  constructor(
    private readonly sessions: ISessionService,
    private readonly catchUpAssistant: IAssistantService,
  ) {}

  /** La session est vérifiée avant d'ouvrir le flux : une session inconnue reste une 404 JSON. */
  catchUp = async (request: SessionRequest, reply: FastifyReply): Promise<void> => {
    const session = this.sessions.get(request.params.sessionId);
    await sendServerSentEvents(reply, this.catchUpAssistant.respond(session.id));
  };
}
