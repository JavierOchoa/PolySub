import { AppError } from "@/lib/utils/errors";

import { getProviderErrorMessage, throwForProviderNetworkError } from "./http";
import type { ProviderAdapter, StructuredJsonRequest } from "./types";

function getAnthropicErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return "Anthropic rejected the API key. Check the key and try again.";
  }

  if (status === 400 || status === 404) {
    return "Anthropic rejected the request. Check the selected model and try again.";
  }

  if (status === 429) {
    return "Anthropic rate limited the request. Wait a moment and try again.";
  }

  return "Anthropic could not complete the translation request.";
}

export const anthropicAdapter: ProviderAdapter = {
  async translateJson(request: StructuredJsonRequest) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": request.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: 4096,
          temperature: request.temperature ?? 0.2,
          system: request.systemPrompt,
          messages: [{ role: "user", content: request.userPrompt }],
          tools: [
            {
              name: "submit_translation",
              description:
                "Return the translated subtitle chunk as strict JSON matching the schema exactly.",
              input_schema: request.jsonSchema,
            },
          ],
          tool_choice: {
            type: "tool",
            name: "submit_translation",
          },
        }),
      }).catch((error) => throwForProviderNetworkError("Anthropic", error));

    if (!response.ok) {
      throw new AppError(
        await getProviderErrorMessage(response, getAnthropicErrorMessage(response.status)),
        response.status,
      );
    }

    const payload = (await response.json()) as {
      content?: Array<{
        type?: string;
        input?: unknown;
      }>;
    };

    const toolResult = payload.content?.find((item) => item.type === "tool_use")?.input;

    if (!toolResult) {
      throw new AppError("Anthropic returned an invalid structured response.");
    }

    return {
      data: toolResult,
    };
  },
};
