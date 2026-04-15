"use client";

import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGE_OPTIONS, TARGET_LANGUAGE_OPTIONS } from "@/lib/utils/language-options";
import {
  PROVIDER_OPTIONS,
  getProviderModelById,
  getVisibleProviderModels,
} from "@/lib/utils/model-options";
import type { ProviderId } from "@/lib/providers/types";
import type { TranslationRequest } from "@/lib/translation/types";

type TranslationOptions = TranslationRequest["options"];

type SettingsPanelProps = {
  provider: ProviderId;
  model: string;
  sourceLanguage: string;
  targetLanguage: string;
  apiKey: string;
  options: TranslationOptions;
  disabled?: boolean;
  onProviderChange: (value: ProviderId) => void;
  onModelChange: (value: string) => void;
  onSourceLanguageChange: (value: string) => void;
  onTargetLanguageChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onOptionsChange: (value: TranslationOptions) => void;
};

export function SettingsPanel({
  provider,
  model,
  sourceLanguage,
  targetLanguage,
  apiKey,
  options,
  disabled,
  onProviderChange,
  onModelChange,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onApiKeyChange,
  onOptionsChange,
}: SettingsPanelProps) {
  const modelOptions = getVisibleProviderModels(provider);
  const selectedModel = getProviderModelById(provider, model);
  const providerLabel = PROVIDER_OPTIONS.find((option) => option.id === provider)?.label ?? "API";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-amber-50/55 p-5">
        <div className="mb-5">
          <p className="text-sm font-semibold text-teal-950">Translation Settings</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose the provider, model, and languages for this translation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select disabled={disabled} onValueChange={(value) => onProviderChange(value as ProviderId)} value={provider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              {provider === "openrouter" ? (
                <>
                  <Input
                    autoComplete="off"
                    disabled={disabled}
                    id="model"
                    onChange={(event) => onModelChange(event.target.value)}
                    placeholder="e.g. openai/gpt-5.4, anthropic/claude-opus-4.6, google/gemini-2.5-flash"
                    type="text"
                    value={model}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Enter any OpenRouter model ID supported by your account.{" "}
                    <a
                      className="underline underline-offset-2 hover:text-foreground"
                      href="https://openrouter.ai/models"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Browse available models
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <Select disabled={disabled} onValueChange={onModelChange} value={model}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Choose a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option.id} textValue={option.label} value={option.id}>
                          {option.label}
                          {option.preview ? " (Preview)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModel ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.recommended ? <Badge>Recommended</Badge> : null}
                      <Badge variant="outline">{selectedModel.speedLabel}</Badge>
                      <Badge variant="outline">{selectedModel.qualityLabel}</Badge>
                      {selectedModel.preview ? <Badge variant="outline">Preview</Badge> : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="source-language">Original Subtitle Language</Label>
              <Select disabled={disabled} onValueChange={onSourceLanguageChange} value={sourceLanguage}>
                <SelectTrigger id="source-language">
                  <SelectValue placeholder="Choose the source language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <SelectItem key={language.requestValue} value={language.requestValue}>
                      {language.displayLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-language">Translate Into</Label>
              <Select disabled={disabled} onValueChange={onTargetLanguageChange} value={targetLanguage}>
                <SelectTrigger id="target-language">
                  <SelectValue placeholder="Select your target language" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_LANGUAGE_OPTIONS.map((language) => (
                    <SelectItem key={language.requestValue} value={language.requestValue}>
                      {language.displayLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-teal-950">{providerLabel} API Key</p>
            <span className="cursor-help text-xs text-muted-foreground" title="Your key is used only for this translation request and is not stored by the app." aria-label="Your key is used only for this translation request and is not stored by the app.">
              ⓘ
            </span>
          </div>
          <Input
            autoComplete="off"
            disabled={disabled}
            id="api-key"
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="Paste your key here"
            type="password"
            value={apiKey}
          />
        </div>

        <details className="group mt-6 rounded-3xl border bg-white/80 p-5" open={false}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-teal-950">
            Advanced Options
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Adjust translation behavior only if you need more control.
          </p>

          <div className="mt-5 space-y-5">
            <label className="flex items-start gap-3 rounded-2xl border bg-white p-4">
              <Checkbox
                checked={options.preserveNames}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onOptionsChange({
                    ...options,
                    preserveNames: checked === true,
                  })
                }
              />
              <span>
                <span className="block text-sm font-medium text-teal-950">Preserve names and honorifics</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Keeps names like character names, titles, and honorifics stable when they should not be translated.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border bg-white p-4">
              <Checkbox
                checked={options.contextAware}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onOptionsChange({
                    ...options,
                    contextAware: checked === true,
                  })
                }
              />
              <span>
                <span className="block text-sm font-medium text-teal-950">Context-aware translation</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Uses rolling summaries and glossary memory between chunks for better dialogue continuity.
                </span>
              </span>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-teal-950">Translation Style</p>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) =>
                      onOptionsChange({
                        ...options,
                        translationStyle: value as TranslationOptions["translationStyle"],
                      })
                    }
                    value={options.translationStyle}
                  >
                    <SelectTrigger id="translation-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="literal">More literal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-teal-950">Chunk Size</p>
                  <Input
                    disabled={disabled}
                    id="chunk-size"
                    max={40}
                    min={4}
                    onChange={(event) =>
                      onOptionsChange({
                        ...options,
                        chunkSize: Number(event.target.value || 18),
                      })
                    }
                    type="number"
                    value={options.chunkSize}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default is 18 subtitle entries per chunk. Smaller chunks can help if a provider struggles with long scenes.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-teal-950">Foreign Dialogue Handling</p>
                <Select
                  disabled={disabled}
                  onValueChange={(value) =>
                    onOptionsChange({
                      ...options,
                      foreignDialogueHandling: value as TranslationOptions["foreignDialogueHandling"],
                    })
                  }
                  value={options.foreignDialogueHandling}
                >
                  <SelectTrigger id="foreign-dialogue-handling">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preserve">Preserve</SelectItem>
                    <SelectItem value="translate_italic">
                      Translate and <em>italicize it</em>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose whether foreign spoken phrases remain unchanged or are translated and italicized.
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
