import { randomUUID } from 'node:crypto';
import type { CaptionSegment, SessionSettings } from '@tablee/shared';
import type { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { describe, expect, it } from 'vitest';
import { LlmUnavailableError } from '../errors';
import type { ILlmClient, ILogger, LlmRequest, TopicWatchEvent } from '../interfaces';
import { InMemoryMetrics } from '../observability';
import { TopicService } from './topic.service';

class FakeLlmClient implements ILlmClient {
  readonly requests: LlmRequest[] = [];

  constructor(private readonly answerFor: (requestNumber: number) => Observable<string>) {}

  stream(request: LlmRequest): Observable<string> {
    this.requests.push(request);
    return this.answerFor(this.requests.length);
  }

  complete(request: LlmRequest): Observable<string> {
    return this.stream(request);
  }
}

const silentLogger: ILogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const settings: SessionSettings = {
  listenerName: 'Mamie',
  nicknames: [],
  guestNames: ['Paul'],
  language: 'fr',
};

const segment = (text: string, endedAt: number): CaptionSegment => ({
  id: randomUUID(),
  text,
  startedAt: Math.max(0, endedAt - 1000),
  endedAt,
});

const createScheduler = (): TestScheduler =>
  new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

const topic = (label: string, at: number): TopicWatchEvent => ({
  type: 'topic',
  topic: { label, at },
});

const llmStatus = (state: 'ok' | 'degraded', at: number): TopicWatchEvent => ({
  type: 'status',
  status: { component: 'llm', state, at },
});

describe('TopicService', () => {
  it('waits for enough words, then asks Gemma right away for a first topic', () => {
    const scheduler = createScheduler();
    scheduler.run(({ cold, hot, expectObservable }) => {
      const llm = new FakeLlmClient(() => cold('5ms (a|)', { a: 'Le gratin de Mamie' }));
      const service = new TopicService(
        llm,
        new InMemoryMetrics(),
        silentLogger,
        { contextMs: 90_000, minWords: 4, refreshMs: 1000 },
        () => scheduler.now(),
      );
      const segments = hot('a 99ms b', {
        a: segment('On mange.', 0),
        b: segment('Le gratin est bon.', 100),
      });

      expectObservable(service.watch(segments, settings)).toBe('105ms t', {
        t: topic('Le gratin de Mamie', 105),
      });
    });
  });

  it('refreshes at most once per period, and only when the conversation moved on', () => {
    const scheduler = createScheduler();
    scheduler.run(({ cold, hot, expectObservable }) => {
      const labels = ['Le gratin', 'Les vacances', 'Le match de Lens'];
      const llm = new FakeLlmClient((requestNumber) =>
        cold('5ms (a|)', { a: labels[requestNumber - 1] ?? 'Autre' }),
      );
      const service = new TopicService(
        llm,
        new InMemoryMetrics(),
        silentLogger,
        { contextMs: 90_000, minWords: 1, refreshMs: 1000 },
        () => scheduler.now(),
      );
      const segments = hot('a 299ms b 299ms c 1899ms d', {
        a: segment('Du gratin ?', 0),
        b: segment('On part en Bretagne.', 300),
        c: segment('Ou en Espagne.', 600),
        d: segment('Lens a gagné.', 2500),
      });

      expectObservable(service.watch(segments, settings)).toBe('5ms x 999ms y 1499ms z', {
        x: topic('Le gratin', 5),
        y: topic('Les vacances', 1005),
        z: topic('Le match de Lens', 2505),
      });
    });
  });

  it('does not repeat a topic that only differs by case, accents or punctuation', () => {
    const scheduler = createScheduler();
    scheduler.run(({ cold, hot, expectObservable }) => {
      const answers = ['Les vacances en Bretagne', '« les vacances en bretagne. »'];
      const llm = new FakeLlmClient((requestNumber) =>
        cold('1ms (a|)', { a: answers[requestNumber - 1] ?? '' }),
      );
      const service = new TopicService(
        llm,
        new InMemoryMetrics(),
        silentLogger,
        { contextMs: 90_000, minWords: 1, refreshMs: 100 },
        () => scheduler.now(),
      );
      const segments = hot('a 499ms b', {
        a: segment('On part en Bretagne.', 0),
        b: segment('En août.', 500),
      });

      expectObservable(service.watch(segments, settings)).toBe('1ms x', {
        x: topic('Les vacances en Bretagne', 1),
      });
    });
  });

  it('reports a degraded model, keeps going, and reports recovery with the next topic', () => {
    const scheduler = createScheduler();
    scheduler.run(({ cold, hot, expectObservable }) => {
      const llm = new FakeLlmClient((requestNumber) =>
        requestNumber === 1
          ? cold('5ms #', undefined, new LlmUnavailableError())
          : cold('5ms (a|)', { a: 'Le travail de Paul' }),
      );
      const service = new TopicService(
        llm,
        new InMemoryMetrics(),
        silentLogger,
        { contextMs: 90_000, minWords: 1, refreshMs: 1000 },
        () => scheduler.now(),
      );
      const segments = hot('a 1999ms b', {
        a: segment('Je change de poste.', 0),
        b: segment("Je deviens responsable à l'hôpital.", 2000),
      });

      expectObservable(service.watch(segments, settings)).toBe('5ms d 1999ms (to)', {
        d: llmStatus('degraded', 5),
        t: topic('Le travail de Paul', 2005),
        o: llmStatus('ok', 2005),
      });
    });
  });

  it('ignores unusable answers instead of showing them', () => {
    const scheduler = createScheduler();
    scheduler.run(({ cold, hot, expectObservable }) => {
      const llm = new FakeLlmClient(() => cold('1ms (a|)', { a: 'AUCUN' }));
      const service = new TopicService(
        llm,
        new InMemoryMetrics(),
        silentLogger,
        { contextMs: 90_000, minWords: 1, refreshMs: 100 },
        () => scheduler.now(),
      );
      const segments = hot('a', { a: segment('Hmm.', 0) });

      expectObservable(service.watch(segments, settings)).toBe('');
    });
  });

  it('only sends the recent part of the conversation to Gemma', () => {
    const scheduler = createScheduler();
    const llm = new FakeLlmClient(() => scheduler.createColdObservable('1ms (a|)', { a: 'Sujet' }));
    scheduler.run(({ hot, expectObservable }) => {
      const service = new TopicService(
        llm,
        new InMemoryMetrics(),
        silentLogger,
        { contextMs: 1000, minWords: 1, refreshMs: 100 },
        () => scheduler.now(),
      );
      const segments = hot('a 4999ms b', {
        a: segment('Ancienne phrase sur le gratin.', 0),
        b: segment('Nouvelle phrase sur le foot.', 5000),
      });
      expectObservable(service.watch(segments, settings)).toBe('1ms t', { t: topic('Sujet', 1) });
    });
    const lastPrompt = llm.requests.at(-1)?.messages.at(-1)?.content ?? '';
    expect(llm.requests).toHaveLength(2);
    expect(lastPrompt).toContain('Nouvelle phrase sur le foot.');
    expect(lastPrompt).not.toContain('gratin');
  });
});
