import type { ProviderAdapter, ProviderId } from "./types";
import { anthropicAdapter } from "./anthropic";
import { googleAdapter } from "./google";
import { openAiAdapter } from "./openai";

const PROVIDER_REGISTRY: Record<ProviderId, ProviderAdapter> = {
  openai: openAiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
};

export function getProviderAdapter(providerId: ProviderId) {
  return PROVIDER_REGISTRY[providerId];
}
