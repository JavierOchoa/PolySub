export type SubtitleFormat = "srt" | "vtt";

export type SubtitleEntry = {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
};

export type SubtitleFile = {
  format: SubtitleFormat;
  entries: SubtitleEntry[];
};

export type SubtitleChunk = {
  chunkIndex: number;
  totalChunks: number;
  entries: SubtitleEntry[];
};
