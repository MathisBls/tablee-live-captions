import { retry, timer, type MonoTypeOperatorFunction } from 'rxjs';
import type { RetryWithBackoffOptions } from '../interfaces';

/** Réessaie `count` fois, en attendant `baseDelayMs`, puis 2×, 3×… entre deux tentatives. */
export const retryWithBackoff = <TValue>({
  count,
  baseDelayMs,
}: RetryWithBackoffOptions): MonoTypeOperatorFunction<TValue> =>
  retry({ count, delay: (_error: unknown, attempt: number) => timer(attempt * baseDelayMs) });
