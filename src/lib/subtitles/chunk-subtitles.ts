import type { SubtitleChunk, SubtitleEntry } from "./types";

type ChunkOptions = {
  chunkSize: number;
  maxCharactersPerChunk?: number;
};

function estimateEntrySize(entry: SubtitleEntry) {
  return entry.text.length + entry.startTime.length + entry.endTime.length;
}

export function chunkSubtitles(entries: SubtitleEntry[], options: ChunkOptions): SubtitleChunk[] {
  const { chunkSize, maxCharactersPerChunk = 2400 } = options;
  const chunks: SubtitleChunk[] = [];
  let currentChunk: SubtitleEntry[] = [];
  let currentCharacters = 0;

  for (const entry of entries) {
    const nextSize = estimateEntrySize(entry);
    const wouldExceedCount = currentChunk.length >= chunkSize;
    const wouldExceedCharacters = currentCharacters + nextSize > maxCharactersPerChunk;

    if (currentChunk.length > 0 && (wouldExceedCount || wouldExceedCharacters)) {
      chunks.push({
        chunkIndex: chunks.length,
        totalChunks: 0,
        entries: currentChunk,
      });
      currentChunk = [];
      currentCharacters = 0;
    }

    currentChunk.push(entry);
    currentCharacters += nextSize;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      chunkIndex: chunks.length,
      totalChunks: 0,
      entries: currentChunk,
    });
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
    totalChunks: chunks.length,
  }));
}
