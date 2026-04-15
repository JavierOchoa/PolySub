import type { ProviderAdapter, ProviderId } from "./types";
import { anthropicAdapter } from "./anthropic";
import { googleAdapter } from "./google";
import { openAiAdapter } from "./openai";
import { openRouterAdapter } from "./openrouter";

const PROVIDER_REGISTRY: Record<ProviderId, ProviderAdapter> = {
  openai: openAiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  openrouter: openRouterAdapter,
};

export function getProviderAdapter(providerId: ProviderId) {
  return PROVIDER_REGISTRY[providerId];
}
