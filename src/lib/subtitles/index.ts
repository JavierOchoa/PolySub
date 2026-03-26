import { AppError } from "@/lib/utils/errors";
import { getFileExtension } from "@/lib/utils/file";

import { buildSrt } from "./build-srt";
import { buildVtt } from "./build-vtt";
import { parseSrt } from "./parse-srt";
import { parseVtt } from "./parse-vtt";
import type { SubtitleFile } from "./types";

export function parseSubtitleFile(fileName: string, content: string): SubtitleFile {
  const extension = getFileExtension(fileName);

  if (!extension) {
    throw new AppError("Unsupported file type. Upload an .srt file or a .vtt file.");
  }

  // The app keeps the original timing/index structure in this parsed format.
  // Models only receive subtitle text plus the matching indexes for a chunk.
  if (extension === ".srt") {
    return parseSrt(content);
  }

  if (extension === ".vtt") {
    return parseVtt(content);
  }

  throw new AppError("Unsupported subtitle file.");
}

export function buildSubtitleFile(file: SubtitleFile) {
  // Rebuilding the file ourselves keeps timestamps and entry boundaries under
  // application control instead of trusting the model to reproduce them.
  if (file.format === "srt") {
    return buildSrt(file.entries);
  }

  return buildVtt(file.entries);
}
