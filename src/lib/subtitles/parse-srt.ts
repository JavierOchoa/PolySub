import { AppError } from "@/lib/utils/errors";

import type { SubtitleEntry, SubtitleFile } from "./types";

const SRT_TIME_SEPARATOR = "-->";
const SRT_TIMESTAMP_PATTERN =
  /^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}$/;

function parseBlock(block: string): SubtitleEntry {
  const lines = block.split("\n").map((line) => line.trimEnd());

  if (lines.length < 3) {
    throw new AppError("The SRT file contains an incomplete subtitle block.");
  }

  const index = Number(lines[0]);

  if (!Number.isInteger(index)) {
    throw new AppError("The SRT file contains an invalid subtitle index.");
  }

  const timeLine = lines[1];

  if (!SRT_TIMESTAMP_PATTERN.test(timeLine)) {
    throw new AppError(`Subtitle ${index} has invalid SRT timestamps.`);
  }

  const [startTime, endTime] = timeLine.split(SRT_TIME_SEPARATOR).map((part) => part.trim());

  if (!startTime || !endTime) {
    throw new AppError("The SRT file contains invalid timestamps.");
  }

  const text = lines.slice(2).join("\n").trim();

  if (!text) {
    throw new AppError(`Subtitle ${index} is empty.`);
  }

  return {
    index,
    startTime,
    endTime,
    text,
  };
}

export function parseSrt(content: string): SubtitleFile {
  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    throw new AppError("The subtitle file is empty. Upload a file that contains subtitle entries.");
  }

  const blocks = normalized.split(/\n{2,}/).filter(Boolean);
  const entries = blocks.map(parseBlock);

  return {
    format: "srt",
    entries,
  };
}
