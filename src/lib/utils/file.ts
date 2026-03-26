import { getLanguageFileSuffix } from "./language-options";

const subtitleExtensions = [".srt", ".vtt"] as const;

export function getFileExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();

  return subtitleExtensions.find((extension) => lowerName.endsWith(extension)) ?? null;
}

export function replaceExtension(fileName: string, extension: string) {
  const parts = fileName.split(".");

  if (parts.length === 1) {
    return `${fileName}${extension}`;
  }

  parts.pop();

  return `${parts.join(".")}${extension}`;
}

export function removeSubtitleExtension(fileName: string) {
  return replaceExtension(fileName, "");
}

export function buildTranslatedSubtitleFileName(
  originalFileName: string,
  targetLanguage: string,
  extension: ".srt" | ".vtt",
) {
  const baseName = removeSubtitleExtension(originalFileName);
  const suffix = getLanguageFileSuffix(targetLanguage);

  return `${baseName}.${suffix}${extension}`;
}
