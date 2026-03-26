import { buildTranslatedSubtitleFileName } from "@/lib/utils/file";
import { AppError } from "@/lib/utils/errors";
import { getProviderAdapter } from "@/lib/providers/registry";
import { buildSubtitleFile, parseSubtitleFile } from "@/lib/subtitles";
import { chunkSubtitles } from "@/lib/subtitles/chunk-subtitles";
import type { SubtitleEntry } from "@/lib/subtitles/types";

import { clampContextSummary } from "./context";
import { applyForeignDialogueSafeguard } from "./foreign-dialogue";
import { mergeGlossary } from "./glossary";
import { buildChunkUserPrompt, buildRepairPrompt, buildSystemPrompt } from "./prompts";
import { translationChunkJsonSchema, translationChunkResponseSchema } from "./schema";
import type { TranslationChunkResponse } from "./schema";
import type { TranslationProgressEvent, TranslationRequest } from "./types";

function applyChunkTranslations(
  entries: SubtitleEntry[],
  response: TranslationChunkResponse,
  request: TranslationRequest,
) {
  const byIndex = new Map(response.translations.map((item) => [item.index, item.translated_text]));
  const expectedIndexes = new Set(entries.map((entry) => entry.index));

  if (byIndex.size !== entries.length) {
    throw new AppError("The model returned missing or duplicate subtitle indexes for one chunk.");
  }

  for (const translatedIndex of byIndex.keys()) {
    if (!expectedIndexes.has(translatedIndex)) {
      throw new AppError(`The model returned an unexpected subtitle index: ${translatedIndex}.`);
    }
  }

  return entries.map((entry) => {
    const translatedText = byIndex.get(entry.index);

    if (!translatedText) {
      throw new AppError(`The model did not return a translation for subtitle ${entry.index}.`);
    }

    const cleanedTranslation = translatedText.trim();

    if (!cleanedTranslation) {
      throw new AppError(`Subtitle ${entry.index} came back empty after translation.`);
    }

    return {
      ...entry,
      // Light-touch safeguard:
      // in preserve mode, keep very short likely-foreign utterances unchanged
      // if the model still translated them.
      text: applyForeignDialogueSafeguard(entry.text, cleanedTranslation, request),
    };
  });
}

async function getValidatedChunkTranslation(
  request: TranslationRequest,
  systemPrompt: string,
  userPrompt: string,
) {
  const adapter = getProviderAdapter(request.provider);
  const response = await adapter.translateJson({
    apiKey: request.apiKey,
    model: request.model,
    systemPrompt,
    userPrompt,
    jsonSchema: translationChunkJsonSchema as Record<string, unknown>,
    temperature: 0.2,
  });

  const rawOutput =
    response.rawText ??
    (typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2));

  try {
    const parsedData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;

    return translationChunkResponseSchema.parse(parsedData);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    const repaired = await adapter.translateJson({
      apiKey: request.apiKey,
      model: request.model,
      systemPrompt,
      userPrompt: buildRepairPrompt(rawOutput, error.message),
      jsonSchema: translationChunkJsonSchema as Record<string, unknown>,
      temperature: 0,
    });

    try {
      const parsedRepairedData =
        typeof repaired.data === "string" ? JSON.parse(repaired.data) : repaired.data;

      return translationChunkResponseSchema.parse(parsedRepairedData);
    } catch {
      throw new AppError("The model returned invalid structured output and the repair step failed.");
    }
  }
}

export async function* translateSubtitles(
  request: TranslationRequest,
): AsyncGenerator<TranslationProgressEvent> {
  yield { type: "stage", stage: "parsing file" };
  const subtitleFile = parseSubtitleFile(request.fileName, request.fileContent);

  if (subtitleFile.entries.length === 0) {
    throw new AppError("The subtitle file does not contain any entries.");
  }

  yield { type: "stage", stage: "preparing chunks" };
  const chunks = chunkSubtitles(subtitleFile.entries, {
    chunkSize: request.options.chunkSize,
  });

  const translatedEntries: SubtitleEntry[] = [];
  const systemPrompt = buildSystemPrompt();
  let contextSummary = "";
  let glossary: Array<{ source: string; target: string }> = [];

  // This loop is the heart of the app:
  // each chunk carries forward a short summary and glossary from earlier chunks.
  for (const chunk of chunks) {
    yield {
      type: "chunk-progress",
      chunk: chunk.chunkIndex + 1,
      totalChunks: chunk.totalChunks,
      stage: `translating chunk ${chunk.chunkIndex + 1} of ${chunk.totalChunks}`,
    };

    const chunkResponse = await getValidatedChunkTranslation(
      request,
      systemPrompt,
      buildChunkUserPrompt({
        chunk: chunk.entries,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        preserveNames: request.options.preserveNames,
        translationStyle: request.options.translationStyle,
        contextAware: request.options.contextAware,
        foreignDialogueHandling: request.options.foreignDialogueHandling,
        memory: {
          contextSummary,
          glossary,
        },
      }),
    );

    translatedEntries.push(...applyChunkTranslations(chunk.entries, chunkResponse, request));
    contextSummary = clampContextSummary(chunkResponse.context_summary);
    glossary = mergeGlossary(glossary, chunkResponse.glossary_updates);
  }

  yield { type: "stage", stage: "rebuilding output" };
  const translatedContent = buildSubtitleFile({
    format: subtitleFile.format,
    entries: translatedEntries,
  });

  yield {
    type: "complete",
    translatedContent,
    translatedFileName: buildTranslatedSubtitleFileName(
      request.fileName,
      request.targetLanguage,
      subtitleFile.format === "srt" ? ".srt" : ".vtt",
    ),
    format: subtitleFile.format,
    totalChunks: chunks.length,
  };
}
