import { AppError } from "@/lib/utils/errors";

import { getProviderErrorMessage, throwForProviderNetworkError } from "./http";
import type { ProviderAdapter, StructuredJsonRequest } from "./types";

function getGoogleErrorMessage(status: number) {
  if (status === 400 || status === 401 || status === 403) {
    return "Google rejected the API key or request. Check the key and selected model.";
  }

  if (status === 429) {
    return "Google rate limited the request. Wait a moment and try again.";
  }

  return "Google could not complete the translation request.";
}

export const googleAdapter: ProviderAdapter = {
  async translateJson(request: StructuredJsonRequest) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${encodeURIComponent(request.apiKey)}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: request.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: request.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: request.temperature ?? 0.2,
            responseMimeType: "application/json",
            responseJsonSchema: request.jsonSchema,
          },
        }),
      }).catch((error) => throwForProviderNetworkError("Google", error));

    if (!response.ok) {
      throw new AppError(
        await getProviderErrorMessage(response, getGoogleErrorMessage(response.status)),
        response.status,
      );
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new AppError("Google returned an empty response.");
    }

    return {
      data: rawText,
      rawText,
    };
  },
};
