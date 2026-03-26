import { AppError } from "@/lib/utils/errors";

import { getProviderErrorMessage, throwForProviderNetworkError } from "./http";
import type { ProviderAdapter, StructuredJsonRequest } from "./types";

function getOpenAiErrorMessage(status: number) {
  if (status === 401) {
    return "OpenAI rejected the API key. Check the key and try again.";
  }

  if (status === 400 || status === 404) {
    return "OpenAI rejected the request. Check the selected model and try again.";
  }

  if (status === 429) {
    return "OpenAI rate limited the request. Wait a moment and try again.";
  }

  return "OpenAI could not complete the translation request.";
}

export const openAiAdapter: ProviderAdapter = {
  async translateJson(request: StructuredJsonRequest) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${request.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          temperature: request.temperature ?? 0.2,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "subtitle_translation_response",
              strict: true,
              schema: request.jsonSchema,
            },
          },
        }),
      }).catch((error) => throwForProviderNetworkError("OpenAI", error));

    if (!response.ok) {
      throw new AppError(
        await getProviderErrorMessage(response, getOpenAiErrorMessage(response.status)),
        response.status,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const rawText = payload.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new AppError("OpenAI returned an empty response.");
    }

    return {
      data: rawText,
      rawText,
    };
  },
};
