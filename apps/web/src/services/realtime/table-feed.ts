import type { ServerEvent } from '@tablee/shared';
import { API_PATHS, serverEventSchema, WS_CLOSE_CODES } from '@tablee/shared';
import type { Observable } from 'rxjs';
import { catchError, defer, EMPTY, map, merge, mergeMap, of, scan } from 'rxjs';
import type { SocketSignal } from '@/interfaces/realtime';
import type { SessionEndReason, TableEvent, TableState } from '@/interfaces/table';
import { fetchReadiness } from '@/services/api/sessions';
import { connectSocket, socketUrl } from './socket';
import { initialTableState, reduceTableEvent } from './table-state';

function parseServerEvent(data: unknown): ServerEvent | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    const parsed = serverEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function endReasonOf(code: number): SessionEndReason {
  if (code === WS_CLOSE_CODES.ORIGIN_FORBIDDEN) {
    return 'forbidden';
  }
  return code === WS_CLOSE_CODES.SESSION_ENDED ? 'ended' : 'not_found';
}

function toTableEvents(signal: SocketSignal): Observable<TableEvent> {
  switch (signal.type) {
    case 'open':
      return of({ kind: 'connection', state: 'live' });
    case 'closed':
      return of({ kind: 'connection', state: 'reconnecting' });
    case 'ended':
      return of({ kind: 'ended', reason: endReasonOf(signal.code) });
    case 'message': {
      // Un message invalide est ignoré : un événement mal formé ne doit jamais casser l'écran.
      const event = parseServerEvent(signal.data);
      return event === null ? EMPTY : of({ kind: 'server', event });
    }
  }
}

/**
 * État de la table en direct : sous-titres, sujet, mentions, santé du pipeline et de la connexion.
 * `/ready` donne l'état initial d'Ollama et de whisper, les événements `status` le tiennent à jour.
 */
export function watchTable(sessionId: string): Observable<TableState> {
  const readiness$ = defer(() => fetchReadiness()).pipe(
    map((readiness): TableEvent => ({ kind: 'readiness', readiness })),
    catchError(() => EMPTY),
  );
  const events$ = connectSocket(socketUrl(API_PATHS.eventsSocket(sessionId))).pipe(
    mergeMap(toTableEvents),
  );
  return merge(readiness$, events$).pipe(scan(reduceTableEvent, initialTableState));
}
