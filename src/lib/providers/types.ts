export type ProviderId = "openai" | "anthropic" | "google";

export type StructuredJsonRequest = {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  temperature?: number;
};

export type StructuredJsonResponse = {
  data: unknown;
  rawText?: string;
};

export interface ProviderAdapter {
  translateJson(request: StructuredJsonRequest): Promise<StructuredJsonResponse>;
}
