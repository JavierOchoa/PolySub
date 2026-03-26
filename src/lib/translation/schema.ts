import { z } from "zod";

const translationItemSchema = z.object({
  index: z.number().int(),
  translated_text: z.string().min(1),
});

const glossaryUpdateSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
});

export const translationChunkResponseSchema = z.object({
  translations: z.array(translationItemSchema),
  context_summary: z.string().min(1),
  glossary_updates: z.array(glossaryUpdateSchema),
});

export type TranslationChunkResponse = z.infer<typeof translationChunkResponseSchema>;

export const translationChunkJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    translations: {
      type: "array",
      description: "One translated text per subtitle index in the current chunk.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: {
            type: "integer",
            description: "Original subtitle index from the input chunk.",
          },
          translated_text: {
            type: "string",
            description: "Natural subtitle translation for that subtitle entry only.",
          },
        },
        required: ["index", "translated_text"],
      },
    },
    context_summary: {
      type: "string",
      description: "Short rolling summary of the dialogue context so far.",
    },
    glossary_updates: {
      type: "array",
      description: "Glossary additions or corrections for recurring names or terms.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source: {
            type: "string",
            description: "Source term or name.",
          },
          target: {
            type: "string",
            description: "Chosen translation or preserved form.",
          },
        },
        required: ["source", "target"],
      },
    },
  },
  required: ["translations", "context_summary", "glossary_updates"],
} as const;
