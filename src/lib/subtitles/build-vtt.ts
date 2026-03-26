import type { SubtitleEntry } from "./types";

export function buildVtt(entries: SubtitleEntry[]) {
  const body = entries
    .map((entry) => `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}`)
    .join("\n\n");

  return `WEBVTT\n\n${body}`;
}
