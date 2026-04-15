import { AppError } from "@/lib/utils/errors";

type ProviderLabel = "OpenAI" | "Anthropic" | "Google" | "OpenRouter";

export function throwForProviderNetworkError(provider: ProviderLabel, error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  throw new AppError(
    `${provider} could not be reached from the server. Check the API key, your internet connection, or your deploy environment and try again.`,
    502,
  );
}

export async function getProviderErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };
    const detail =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? payload.message ?? "";

    return detail ? `${fallbackMessage} ${detail}` : fallbackMessage;
  } catch {
    try {
      const detail = (await response.text()).trim();
      return detail ? `${fallbackMessage} ${detail}` : fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
}
