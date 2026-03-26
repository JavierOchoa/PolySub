import { z } from "zod";

import type { SubtitleEntry, SubtitleFormat } from "@/lib/subtitles/types";

export const translationStyleSchema = z.enum(["natural", "neutral", "literal"]);
export const foreignDialogueHandlingSchema = z.enum(["preserve", "translate_italic"]);

export const translationRequestSchema = z.object({
  fileName: z.string().min(1),
  fileContent: z.string().min(1),
  provider: z.enum(["openai", "anthropic", "google"]),
  model: z.string().min(1),
  apiKey: z.string().min(1),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  options: z.object({
    preserveNames: z.boolean(),
    contextAware: z.boolean().default(true),
    foreignDialogueHandling: foreignDialogueHandlingSchema,
    translationStyle: translationStyleSchema,
    chunkSize: z.coerce.number().int().min(4).max(40),
  }),
});

export type TranslationRequest = z.infer<typeof translationRequestSchema>;

export type GlossaryTerm = {
  source: string;
  target: string;
};

export type TranslationMemory = {
  contextSummary: string;
  glossary: GlossaryTerm[];
};

export type ChunkPromptPayload = {
  chunk: SubtitleEntry[];
  sourceLanguage: string;
  targetLanguage: string;
  preserveNames: boolean;
  translationStyle: z.infer<typeof translationStyleSchema>;
  contextAware: boolean;
  foreignDialogueHandling: z.infer<typeof foreignDialogueHandlingSchema>;
  memory: TranslationMemory;
};

export type TranslationProgressEvent =
  | { type: "stage"; stage: string }
  | { type: "chunk-progress"; chunk: number; totalChunks: number; stage: string }
  | {
      type: "complete";
      translatedContent: string;
      translatedFileName: string;
      format: SubtitleFormat;
      totalChunks: number;
    };
