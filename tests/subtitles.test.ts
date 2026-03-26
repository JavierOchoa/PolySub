import test from "node:test";
import assert from "node:assert/strict";

import { buildSubtitleFile, parseSubtitleFile } from "@/lib/subtitles";
import { chunkSubtitles } from "@/lib/subtitles/chunk-subtitles";
import { buildTranslatedSubtitleFileName } from "@/lib/utils/file";

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:03,000
Hello there.

2
00:00:03,200 --> 00:00:05,000
How are you?

3
00:00:05,200 --> 00:00:07,000
I am fine.
Thanks.`;

test("parseSubtitleFile parses multiline SRT entries and buildSubtitleFile rebuilds them", () => {
  const subtitleFile = parseSubtitleFile("sample.srt", SAMPLE_SRT);

  assert.equal(subtitleFile.format, "srt");
  assert.equal(subtitleFile.entries.length, 3);
  assert.equal(subtitleFile.entries[2]?.text, "I am fine.\nThanks.");

  const rebuilt = buildSubtitleFile(subtitleFile);
  assert.match(rebuilt, /00:00:05,200 --> 00:00:07,000/);
  assert.match(rebuilt, /I am fine\.\nThanks\./);
});

test("chunkSubtitles keeps subtitle order and splits by configured chunk size", () => {
  const subtitleFile = parseSubtitleFile("sample.srt", SAMPLE_SRT);
  const chunks = chunkSubtitles(subtitleFile.entries, { chunkSize: 2, maxCharactersPerChunk: 9999 });

  assert.equal(chunks.length, 2);
  assert.deepEqual(
    chunks.map((chunk) => chunk.entries.map((entry) => entry.index)),
    [[1, 2], [3]],
  );
});

test("buildTranslatedSubtitleFileName uses media-friendly language suffixes", () => {
  assert.equal(buildTranslatedSubtitleFileName("movie.srt", "Spanish", ".srt"), "movie.es.srt");
  assert.equal(
    buildTranslatedSubtitleFileName("movie.srt", "Spanish (Latin America)", ".srt"),
    "movie.es-419.srt",
  );
  assert.equal(
    buildTranslatedSubtitleFileName("movie.srt", "Portuguese (Brazil)", ".srt"),
    "movie.pt-BR.srt",
  );
  assert.equal(buildTranslatedSubtitleFileName("episode.vtt", "English", ".vtt"), "episode.en.vtt");
});
