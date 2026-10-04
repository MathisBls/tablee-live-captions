import type { CaptionSegment, TopicUpdate } from '@tablee/shared';
import type { ISessionRepository, TableSession } from '../interfaces';

/** Un repas de deux heures fait ~1 800 segments de 4 s : on garde de quoi couvrir largement un rattrapage. */
const MAX_SEGMENTS_PER_SESSION = 600;

class SessionRecord {
  readonly segments: CaptionSegment[] = [];
  topic: TopicUpdate | null = null;

  constructor(readonly session: TableSession) {}
}

/** Sessions en mémoire uniquement : un redémarrage du serveur efface toute conversation. */
export class InMemorySessionRepository implements ISessionRepository {
  private readonly records = new Map<string, SessionRecord>();

  save(session: TableSession): void {
    this.records.set(session.id, new SessionRecord(session));
  }

  findById(sessionId: string): TableSession | undefined {
    return this.records.get(sessionId)?.session;
  }

  delete(sessionId: string): boolean {
    return this.records.delete(sessionId);
  }

  count(): number {
    return this.records.size;
  }

  listIds(): readonly string[] {
    return [...this.records.keys()];
  }

  findExpiredIds(now: number): readonly string[] {
    return [...this.records.values()]
      .filter((record) => record.session.expiresAt <= now)
      .map((record) => record.session.id);
  }

  appendSegment(sessionId: string, segment: CaptionSegment): void {
    const record = this.records.get(sessionId);
    if (record === undefined) return;
    record.segments.push(segment);
    if (record.segments.length > MAX_SEGMENTS_PER_SESSION) record.segments.shift();
  }

  segmentsSince(sessionId: string, since: number): readonly CaptionSegment[] {
    return (this.records.get(sessionId)?.segments ?? []).filter(
      (segment) => segment.endedAt >= since,
    );
  }

  latestSegments(sessionId: string, limit: number): readonly CaptionSegment[] {
    return (this.records.get(sessionId)?.segments ?? []).slice(-limit);
  }

  setTopic(sessionId: string, topic: TopicUpdate): void {
    const record = this.records.get(sessionId);
    if (record !== undefined) record.topic = topic;
  }

  currentTopic(sessionId: string): TopicUpdate | null {
    return this.records.get(sessionId)?.topic ?? null;
  }
}
