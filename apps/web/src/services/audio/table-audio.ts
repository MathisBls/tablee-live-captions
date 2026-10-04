import { API_PATHS } from '@tablee/shared';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  share,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import type { LinkStatus, MicSignal, MicStatus, TableAudio } from '@/interfaces/audio';
import type { SocketSignal } from '@/interfaces/realtime';
import { connectSocket, socketUrl } from '@/services/realtime/socket';
import { captureMicrophone } from './mic-capture';

function isFrame(signal: MicSignal): signal is Extract<MicSignal, { type: 'frame' }> {
  return signal.type === 'frame';
}

function isStatusSignal(signal: MicSignal): signal is Exclude<MicSignal, { type: 'frame' }> {
  return signal.type !== 'frame';
}

function micStatusOf(signal: Exclude<MicSignal, { type: 'frame' }>): MicStatus {
  return signal.type === 'failed' ? signal.reason : signal.type;
}

function linkStatusOf(signal: SocketSignal): LinkStatus {
  switch (signal.type) {
    case 'open':
    case 'message':
      return 'live';
    case 'closed':
      return 'reconnecting';
    case 'ended':
      return 'ended';
  }
}

/**
 * Écoute de la table : une seule capture micro, partagée entre l'envoi des trames vers
 * /ws/sessions/:id/audio et l'affichage du niveau (la flamme). Rien ne démarre avant l'abonnement.
 */
export function createTableAudio(sessionId: string): TableAudio {
  const restarts = new Subject<void>();
  const capture$ = restarts.pipe(
    startWith(undefined),
    switchMap(() => captureMicrophone()),
    share(),
  );
  const frames$ = capture$.pipe(filter(isFrame));

  const mic$ = capture$.pipe(filter(isStatusSignal), map(micStatusOf), distinctUntilChanged());
  const link$ = connectSocket(
    socketUrl(API_PATHS.audioSocket(sessionId)),
    frames$.pipe(map((signal) => signal.pcm)),
  ).pipe(map(linkStatusOf), startWith<LinkStatus>('connecting'), distinctUntilChanged());

  return {
    status$: combineLatest({ mic: mic$, link: link$ }),
    level$: frames$.pipe(map((signal) => signal.level)),
    restart: () => {
      restarts.next();
    },
  };
}
