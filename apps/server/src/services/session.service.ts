import type { SessionSettings } from '@tablee/shared';
import { SessionNotFoundError, TooManySessionsError } from '../errors';
import { createTableSession } from '../models';
import type {
  ILogger,
  ISessionRepository,
  ISessionService,
  ITranscriptService,
  SessionsConfig,
  TableSession,
} from '../interfaces';

/** Cycle de vie des sessions : création bornée, expiration, fin explicite. Rien ne survit à une session. */
export class SessionService implements ISessionService {
  constructor(
    private readonly repository: ISessionRepository,
    private readonly transcripts: ITranscriptService,
    private readonly config: SessionsConfig,
    private readonly logger: ILogger,
    private readonly now: () => number = Date.now,
  ) {}

  create(settings: SessionSettings): TableSession {
    this.purgeExpired(this.now());
    if (this.repository.count() >= this.config.maxSessions) {
      throw new TooManySessionsError(this.config.maxSessions);
    }
    const session = createTableSession(settings, this.now(), this.config.ttlMinutes);
    this.repository.save(session);
    this.transcripts.start(session);
    this.logger.info({ sessionId: session.id, language: settings.language }, 'Session started');
    return session;
  }

  get(sessionId: string): TableSession {
    const session = this.repository.findById(sessionId);
    if (session === undefined || session.expiresAt <= this.now()) throw new SessionNotFoundError();
    return session;
  }

  isActive(sessionId: string): boolean {
    const session = this.repository.findById(sessionId);
    return session !== undefined && session.expiresAt > this.now();
  }

  end(sessionId: string): void {
    if (this.repository.findById(sessionId) === undefined) throw new SessionNotFoundError();
    this.discard(sessionId);
    this.logger.info({ sessionId }, 'Session ended');
  }

  purgeExpired(now: number): void {
    for (const sessionId of this.repository.findExpiredIds(now)) {
      this.discard(sessionId);
      this.logger.info({ sessionId }, 'Session expired');
    }
  }

  endAll(): void {
    for (const sessionId of this.repository.listIds()) this.discard(sessionId);
  }

  private discard(sessionId: string): void {
    this.transcripts.stop(sessionId);
    this.repository.delete(sessionId);
  }
}
