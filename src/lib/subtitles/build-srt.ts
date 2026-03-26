import type { SubtitleEntry } from "./types";

export function buildSrt(entries: SubtitleEntry[]) {
  return entries
    .map((entry) => `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}`)
    .join("\n\n");
}
