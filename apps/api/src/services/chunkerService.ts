export interface TextChunk {
  text: string;
  page: number | null;
  index: number;
}

interface SplitOptions {
  chunkSize?: number;
  overlap?: number;
}

export function chunkText(raw: string, options: SplitOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? 800;
  const overlap = options.overlap ?? 120;

  if (chunkSize <= overlap || overlap < 0) {
    throw new Error("Invalid chunking parameters: chunkSize must exceed overlap");
  }

  const pages = splitByPages(raw);
  const chunks: TextChunk[] = [];
  let index = 0;

  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 0);

    let current = "";
    for (const paragraph of paragraphs) {
      if ((current + paragraph).length > chunkSize && current.length > 0) {
        chunks.push({ text: current.trim(), page: page.number, index: index++ });
        current = paragraph;
        continue;
      }
      if (current.length > 0) {
        current += "\n\n" + paragraph;
      } else {
        current = paragraph;
      }
    }
    if (current.length > 0) {
      chunks.push({ text: current.trim(), page: page.number, index: index++ });
    }
  }

  return applyOverlap(chunks, overlap);
}

function splitByPages(raw: string): { text: string; number: number | null }[] {
  const markers = raw.split(/\f/);
  if (markers.length <= 1) return [{ text: raw, number: null }];
  return markers
    .map((text, i) => ({ text, number: i + 1 }))
    .filter((p) => p.text.trim().length > 0);
}

function applyOverlap(chunks: TextChunk[], overlap: number): TextChunk[] {
  if (overlap <= 0 || chunks.length <= 1) return chunks;
  const result: TextChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    if (i > 0) {
      const prev = chunks[i - 1];
      if (prev) {
        const tail = prev.text.slice(-overlap);
        chunk.text = tail + "\n\n" + chunk.text;
      }
    }
    result.push(chunk);
  }
  return result;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
