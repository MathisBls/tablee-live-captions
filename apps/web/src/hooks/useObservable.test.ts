import { act, renderHook } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useObservable } from './useObservable';

describe('useObservable', () => {
  it('returns the initial value until the source emits, then the latest value', () => {
    const topics = new Subject<string>();
    const { result } = renderHook(() => useObservable(topics, 'on écoute d’abord un peu…'));

    expect(result.current).toBe('on écoute d’abord un peu…');
    act(() => {
      topics.next('Les vacances en Bretagne');
    });
    expect(result.current).toBe('Les vacances en Bretagne');
    act(() => {
      topics.next('Le gratin de Mamie');
    });
    expect(result.current).toBe('Le gratin de Mamie');
  });

  it('picks up a value emitted synchronously on subscription', () => {
    const level = new BehaviorSubject(0.4);
    const { result } = renderHook(() => useObservable(level, 0));
    expect(result.current).toBe(0.4);
  });

  it('unsubscribes when the component unmounts', () => {
    const captions = new Subject<string>();
    const { unmount } = renderHook(() => useObservable(captions, ''));

    expect(captions.observed).toBe(true);
    unmount();
    expect(captions.observed).toBe(false);
  });

  it('switches to a new source and drops the previous one', () => {
    const first = new Subject<number>();
    const second = new Subject<number>();
    const { result, rerender } = renderHook(({ source }) => useObservable(source, 0), {
      initialProps: { source: first },
    });

    rerender({ source: second });
    expect(first.observed).toBe(false);
    act(() => {
      first.next(1);
      second.next(2);
    });
    expect(result.current).toBe(2);
  });
});
