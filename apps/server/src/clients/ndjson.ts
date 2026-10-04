/** Lignes non vides d'un corps de réponse NDJSON, au fur et à mesure qu'elles arrivent. */
export async function* readLines(body: AsyncIterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let pending = '';
  for await (const bytes of body) {
    pending += decoder.decode(bytes, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim().length > 0) yield line;
    }
  }
  pending += decoder.decode();
  if (pending.trim().length > 0) yield pending;
}
