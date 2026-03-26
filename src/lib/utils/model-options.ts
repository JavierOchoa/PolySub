import type { ProviderId } from "@/lib/providers/types";

export type ProviderModelOption = {
  id: string;
  label: string;
  provider: ProviderId;
  description: string;
  recommended?: boolean;
  speedLabel: string;
  qualityLabel: string;
  preview?: boolean;
  legacy?: boolean;
};

export const PROVIDER_OPTIONS: Array<{ id: ProviderId; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
];

// This file is the single curated model catalog for the app.
// Keep it simple:
// - add new models here by provider
// - mark `recommended: true` for the best default pick
// - mark `preview: true` for models that are not stable yet
// - keep the visible list small so non-technical users are not overwhelmed
export const PROVIDER_MODELS: Record<ProviderId, ProviderModelOption[]> = {
  openai: [
    {
      id: "gpt-5.4",
      label: "GPT-5.4",
      provider: "openai",
      description: "Best OpenAI default for subtitle translation when you want the strongest overall quality and consistency.",
      recommended: true,
      speedLabel: "Balanced",
      qualityLabel: "High",
    },
    {
      id: "gpt-5.4-mini",
      label: "GPT-5.4 Mini",
      provider: "openai",
      description: "Faster OpenAI option for lower latency and lower cost while still handling subtitle chunks well.",
      speedLabel: "Fast",
      qualityLabel: "Balanced",
    },
    {
      id: "gpt-5.4-nano",
      label: "GPT-5.4 Nano",
      provider: "openai",
      description: "Cheapest OpenAI option for lighter jobs where cost matters more than nuance.",
      speedLabel: "Cheapest",
      qualityLabel: "Basic",
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet-4-6",
      label: "Claude Sonnet 4.6",
      provider: "anthropic",
      description: "Best Anthropic default for subtitle work, with strong quality and good speed.",
      recommended: true,
      speedLabel: "Balanced",
      qualityLabel: "High",
    },
    {
      id: "claude-opus-4-6",
      label: "Claude Opus 4.6",
      provider: "anthropic",
      description: "Premium option for harder scenes where nuance and consistency matter more than speed.",
      speedLabel: "Slower",
      qualityLabel: "Advanced / premium",
    },
    {
      id: "claude-haiku-4-5",
      label: "Claude Haiku 4.5",
      provider: "anthropic",
      description: "Fast Anthropic option when you want lower cost and quicker turnaround.",
      speedLabel: "Fast",
      qualityLabel: "Balanced",
    },
  ],
  google: [
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      provider: "google",
      description: "Best stable Google pick for speed, reliability, and structured output support.",
      recommended: true,
      speedLabel: "Fast",
      qualityLabel: "Balanced",
    },
    {
      id: "gemini-2.5-pro",
      label: "Gemini 2.5 Pro",
      provider: "google",
      description: "More advanced stable Google option for difficult or nuance-heavy subtitle files.",
      speedLabel: "Balanced",
      qualityLabel: "Advanced / premium",
    },
    {
      id: "gemini-2.5-flash-lite",
      label: "Gemini 2.5 Flash-Lite",
      provider: "google",
      description: "Fastest stable Google option for high-volume or lower-cost subtitle translation.",
      speedLabel: "Fast / budget",
      qualityLabel: "Balanced",
    },
    {
      id: "gemini-3-flash-preview",
      label: "Gemini 3 Flash",
      provider: "google",
      description: "Newer Gemini 3 family option for testing frontier performance, but still preview-only.",
      speedLabel: "Fast",
      qualityLabel: "High",
      preview: true,
    },
    {
      id: "gemini-3-pro-preview",
      label: "Gemini 3 Pro",
      provider: "google",
      description: "Newer Gemini 3 premium preview option for testing advanced performance before it becomes stable.",
      speedLabel: "Balanced",
      qualityLabel: "Advanced / premium",
      preview: true,
    },
  ],
};

export function getVisibleProviderModels(provider: ProviderId) {
  return PROVIDER_MODELS[provider].filter((model) => !model.legacy);
}

export function getDefaultModelForProvider(provider: ProviderId) {
  const visibleModels = getVisibleProviderModels(provider);

  return visibleModels.find((model) => model.recommended)?.id ?? visibleModels[0]?.id ?? "";
}

export function getProviderModelById(provider: ProviderId, modelId: string) {
  return PROVIDER_MODELS[provider].find((model) => model.id === modelId);
}

export function hasLegacyProviderModels(provider: ProviderId) {
  return PROVIDER_MODELS[provider].some((model) => model.legacy);
}
