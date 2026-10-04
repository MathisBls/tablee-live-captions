import { describe, expect, it } from 'vitest';
import { createSseParser } from './sse';

describe('createSseParser', () => {
  it('returns one payload per event block', () => {
    const parser = createSseParser();
    expect(
      parser.push('data: {"type":"token","text":"Paul"}\n\ndata: {"type":"done"}\n\n'),
    ).toEqual(['{"type":"token","text":"Paul"}', '{"type":"done"}']);
  });

  it('waits for the blank line when an event is split across network chunks', () => {
    const parser = createSseParser();
    expect(parser.push('data: {"type":"tok')).toEqual([]);
    expect(parser.push('en","text":" parle"}\n')).toEqual([]);
    expect(parser.push('\n')).toEqual(['{"type":"token","text":" parle"}']);
  });

  it('handles CRLF line endings, even when \\r and \\n arrive in different chunks', () => {
    const parser = createSseParser();
    expect(parser.push('data: {"type":"done"}\r\n\r')).toEqual([]);
    expect(parser.push('\n')).toEqual(['{"type":"done"}']);
  });

  it('joins multi-line data fields and ignores comments and other fields', () => {
    const parser = createSseParser();
    expect(parser.push(': keep-alive\n\nevent: x\ndata: ligne 1\ndata: ligne 2\n\n')).toEqual([
      'ligne 1\nligne 2',
    ]);
  });

  it('keeps the payload intact when there is no space after the colon', () => {
    const parser = createSseParser();
    expect(parser.push('data:{"type":"done"}\n\n')).toEqual(['{"type":"done"}']);
  });

  it('flushes a last event that was not followed by a blank line', () => {
    const parser = createSseParser();
    expect(parser.push('data: {"type":"done"}')).toEqual([]);
    expect(parser.flush()).toEqual(['{"type":"done"}']);
    expect(parser.flush()).toEqual([]);
  });
});
