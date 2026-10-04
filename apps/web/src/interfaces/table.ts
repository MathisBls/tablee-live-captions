import type {
  CaptionSegment,
  MentionAlert,
  PipelineComponent,
  PipelineState,
  ReadinessDto,
  ServerEvent,
  TextRange,
  TopicUpdate,
} from '@tablee/shared';

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'ended';

export type SessionEndReason = 'not_found' | 'ended' | 'forbidden';

export interface CaptionEntry {
  readonly segment: CaptionSegment;
  readonly highlights: readonly TextRange[];
  /** `live` : reçu en direct, affiché mot par mot. `history` : reçu dans un snapshot, affiché d'un coup. */
  readonly arrival: 'live' | 'history';
}

export interface TableState {
  readonly entries: readonly CaptionEntry[];
  readonly topic: TopicUpdate | null;
  readonly lastMention: MentionAlert | null;
  readonly pipeline: Readonly<Record<PipelineComponent, PipelineState>>;
  readonly connection: ConnectionState;
  readonly endReason: SessionEndReason | null;
}

export type TableEvent =
  | { readonly kind: 'server'; readonly event: ServerEvent }
  | { readonly kind: 'connection'; readonly state: 'live' | 'reconnecting' }
  | { readonly kind: 'ended'; readonly reason: SessionEndReason }
  | { readonly kind: 'readiness'; readonly readiness: ReadinessDto };
