import { AppError } from "@/lib/utils/errors";

import type { SubtitleEntry, SubtitleFile } from "./types";

const VTT_TIME_SEPARATOR = "-->";

function stripCueSettings(endTime: string) {
  return endTime.split(" ")[0];
}

function parseCue(block: string, fallbackIndex: number): SubtitleEntry {
  const lines = block.split("\n").map((line) => line.trimEnd());
  let cursor = 0;
  let index = fallbackIndex;

  if (lines[0] && !lines[0].includes(VTT_TIME_SEPARATOR)) {
    const maybeIndex = Number(lines[0]);

    if (Number.isInteger(maybeIndex)) {
      index = maybeIndex;
    }

    cursor += 1;
  }

  const timeLine = lines[cursor];

  if (!timeLine?.includes(VTT_TIME_SEPARATOR)) {
    throw new AppError("The VTT file contains an invalid cue.");
  }

  const [startTime, rawEndTime] = timeLine.split(VTT_TIME_SEPARATOR).map((part) => part.trim());
  const text = lines.slice(cursor + 1).join("\n").trim();

  if (!text) {
    throw new AppError(`Cue ${index} is empty.`);
  }

  return {
    index,
    startTime,
    endTime: stripCueSettings(rawEndTime),
    text,
  };
}

export function parseVtt(content: string): SubtitleFile {
  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    throw new AppError("The subtitle file is empty.");
  }

  const withoutHeader = normalized.replace(/^WEBVTT\s*\n+/i, "");
  const blocks = withoutHeader.split(/\n{2,}/).filter(Boolean);
  const entries = blocks.map((block, index) => parseCue(block, index + 1));

  return {
    format: "vtt",
    entries,
  };
}
