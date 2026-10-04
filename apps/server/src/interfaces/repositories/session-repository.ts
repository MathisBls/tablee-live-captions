import type { CaptionSegment, TopicUpdate } from '@tablee/shared';
import type { TableSession } from '../models/table-session';

/** Stockage en mémoire des sessions et de leur transcript. Rien n'est jamais écrit sur disque. */
export interface ISessionRepository {
  save(session: TableSession): void;
  findById(sessionId: string): TableSession | undefined;
  /** Supprime la session et tout son transcript. Renvoie false si elle n'existait pas. */
  delete(sessionId: string): boolean;
  count(): number;
  listIds(): readonly string[];
  findExpiredIds(now: number): readonly string[];
  appendSegment(sessionId: string, segment: CaptionSegment): void;
  /** Segments terminés à partir de `since` (epoch ms), du plus ancien au plus récent. */
  segmentsSince(sessionId: string, since: number): readonly CaptionSegment[];
  latestSegments(sessionId: string, limit: number): readonly CaptionSegment[];
  setTopic(sessionId: string, topic: TopicUpdate): void;
  currentTopic(sessionId: string): TopicUpdate | null;
}
