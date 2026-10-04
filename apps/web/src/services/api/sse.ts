import type { SseParser } from '@/interfaces/api';

function dataOf(block: string): string | null {
  const dataLines = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).replace(/^ /, ''));
  return dataLines.length === 0 ? null : dataLines.join('\n');
}

/**
 * Parseur `text/event-stream` minimal : on n'utilise que le champ `data:` (pas d'`event:` ni d'`id:`
 * dans le contrat). Les commentaires (`:`) et autres champs sont ignorés.
 */
export function createSseParser(): SseParser {
  let buffer = '';

  const drain = (): string[] => {
    const payloads: string[] = [];
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const data = dataOf(buffer.slice(0, boundary));
      if (data !== null) {
        payloads.push(data);
      }
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }
    return payloads;
  };

  return {
    push: (chunk) => {
      // Un \r en fin de morceau peut être la moitié d'un \r\n : on attend le morceau suivant pour trancher.
      const text = buffer + chunk;
      const pendingCarriageReturn = text.endsWith('\r');
      buffer = (pendingCarriageReturn ? text.slice(0, -1) : text).replace(/\r\n?/g, '\n');
      const payloads = drain();
      if (pendingCarriageReturn) {
        buffer += '\r';
      }
      return payloads;
    },
    flush: () => {
      const data = dataOf(buffer.replace(/\r\n?/g, '\n'));
      buffer = '';
      return data === null ? [] : [data];
    },
  };
}
