import { WS_CLOSE_CODES } from '@tablee/shared';
import type { Subscription } from 'rxjs';
import { defer, EMPTY, Observable, retry, tap, timer } from 'rxjs';
import type { SocketSignal } from '@/interfaces/realtime';

const terminalCloseCodes: ReadonlySet<number> = new Set([
  WS_CLOSE_CODES.SESSION_NOT_FOUND,
  WS_CLOSE_CODES.SESSION_ENDED,
  WS_CLOSE_CODES.ORIGIN_FORBIDDEN,
]);

const MAX_RECONNECT_DELAY_MS = 10_000;
const FIRST_RECONNECT_DELAY_MS = 500;
/** Au-delà, on jette les trames audio plutôt que d'accumuler de la latence derrière un réseau lent. */
const MAX_BUFFERED_BYTES = 256 * 1024;

/** Délai avant la n-ième tentative de reconnexion : 0,5 s, 1 s, 2 s… plafonné à 10 s. */
export function reconnectDelay(failures: number): number {
  return Math.min(MAX_RECONNECT_DELAY_MS, FIRST_RECONNECT_DELAY_MS * 2 ** Math.max(0, failures - 1));
}

/** URL absolue `ws:`/`wss:` d'un chemin relatif, pour passer par le même hôte (et le proxy Vite). */
export function socketUrl(path: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

class SocketClosedError extends Error {
  constructor(readonly code: number) {
    super(`socket closed with code ${code}`);
    this.name = 'SocketClosedError';
  }
}

function openSocketOnce(url: string, outgoing$: Observable<ArrayBuffer>): Observable<SocketSignal> {
  return new Observable<SocketSignal>((subscriber) => {
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    let outgoing: Subscription | null = null;

    socket.onopen = () => {
      subscriber.next({ type: 'open' });
      outgoing = outgoing$.subscribe((frame) => {
        if (socket.readyState === WebSocket.OPEN && socket.bufferedAmount < MAX_BUFFERED_BYTES) {
          socket.send(frame);
        }
      });
    };
    socket.onmessage = (event: MessageEvent<unknown>) => {
      subscriber.next({ type: 'message', data: event.data });
    };
    socket.onclose = (event) => {
      outgoing?.unsubscribe();
      if (terminalCloseCodes.has(event.code)) {
        subscriber.next({ type: 'ended', code: event.code });
        subscriber.complete();
        return;
      }
      subscriber.next({ type: 'closed', code: event.code });
      subscriber.error(new SocketClosedError(event.code));
    };

    return () => {
      outgoing?.unsubscribe();
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
        socket.close(1000);
      }
    };
  });
}

/**
 * Connexion WebSocket qui se reconnecte seule avec un backoff exponentiel, sauf sur les codes de
 * fermeture définitifs. `outgoing$` est envoyé tant que la socket est ouverte (trames audio).
 *
 * On n'utilise pas `rxjs/webSocket` : il termine le flux sur une fermeture « propre », ce qui
 * empêche de distinguer un serveur qui redémarre d'une session terminée.
 */
export function connectSocket(
  url: string,
  outgoing$: Observable<ArrayBuffer> = EMPTY,
): Observable<SocketSignal> {
  return defer(() => {
    let failures = 0;
    return openSocketOnce(url, outgoing$).pipe(
      tap((signal) => {
        if (signal.type === 'open') {
          failures = 0;
        }
      }),
      retry({
        delay: () => {
          failures += 1;
          return timer(reconnectDelay(failures));
        },
      }),
    );
  });
}
