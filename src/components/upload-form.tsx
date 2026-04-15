"use client";

import { useMemo, useRef, useState } from "react";
import { LoaderCircle, OctagonX, Sparkles } from "lucide-react";

import { ProgressPanel } from "@/components/progress-panel";
import { ResultPanel } from "@/components/result-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProviderId } from "@/lib/providers/types";
import { translationRequestSchema, type TranslationRequest } from "@/lib/translation/types";
import { getFileExtension } from "@/lib/utils/file";
import { getDefaultModelForProvider } from "@/lib/utils/model-options";

type StreamEvent =
  | { type: "stage"; stage: string }
  | { type: "chunk-progress"; chunk: number; totalChunks: number; stage: string }
  | { type: "complete"; translatedContent: string; translatedFileName: string; totalChunks: number }
  | { type: "error"; message: string };

const DEFAULT_PROVIDER: ProviderId = "openai";
const DEFAULT_MODEL = getDefaultModelForProvider(DEFAULT_PROVIDER);
const DEFAULT_SOURCE_LANGUAGE = "Auto-detect";
const DEFAULT_TARGET_LANGUAGE = "";
const DEFAULT_OPTIONS: TranslationRequest["options"] = {
  preserveNames: true,
  contextAware: true,
  foreignDialogueHandling: "translate_italic",
  translationStyle: "natural",
  chunkSize: 18,
};

function readFriendlyClientError(error: unknown) {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "The app could not reach the translation route. Make sure the app is still running and try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Translation failed.";
}

function parseStreamLine(line: string) {
  return JSON.parse(line) as StreamEvent;
}

type WorkflowState = "idle" | "needs_settings" | "ready" | "running" | "success" | "error";

export function UploadForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState(DEFAULT_SOURCE_LANGUAGE);
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_TARGET_LANGUAGE);
  const [options, setOptions] = useState<TranslationRequest["options"]>({ ...DEFAULT_OPTIONS });
  const [stage, setStage] = useState("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedFileName, setTranslatedFileName] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const hasResult = Boolean(translatedContent && translatedFileName);
  const isPristine = useMemo(
    () =>
      !file &&
      provider === DEFAULT_PROVIDER &&
      model === DEFAULT_MODEL &&
      apiKey === "" &&
      sourceLanguage === DEFAULT_SOURCE_LANGUAGE &&
      targetLanguage === DEFAULT_TARGET_LANGUAGE &&
      options.preserveNames === DEFAULT_OPTIONS.preserveNames &&
      options.contextAware === DEFAULT_OPTIONS.contextAware &&
      options.foreignDialogueHandling === DEFAULT_OPTIONS.foreignDialogueHandling &&
      options.translationStyle === DEFAULT_OPTIONS.translationStyle &&
      options.chunkSize === DEFAULT_OPTIONS.chunkSize &&
      stage === "" &&
      currentChunk === 0 &&
      totalChunks === 0 &&
      activityLog.length === 0 &&
      !error &&
      !translatedContent &&
      !translatedFileName &&
      !isRunning,
    [
      activityLog.length,
      apiKey,
      currentChunk,
      error,
      file,
      isRunning,
      model,
      options.chunkSize,
      options.contextAware,
      options.foreignDialogueHandling,
      options.preserveNames,
      options.translationStyle,
      provider,
      sourceLanguage,
      stage,
      targetLanguage,
      totalChunks,
      translatedContent,
      translatedFileName,
    ],
  );

  const validationMessage = useMemo(() => {
    if (!file) {
      return "Upload a subtitle file to begin.";
    }

    const extension = getFileExtension(file.name);

    if (!extension) {
      return "Unsupported file type. Use .srt or .vtt.";
    }

    if (!apiKey.trim()) {
      return "Paste your API key.";
    }

    if (!provider || !model || !sourceLanguage || !targetLanguage) {
      return "Complete all required settings.";
    }

    if (provider === "openrouter" && !model.trim()) {
      return "Enter an OpenRouter model ID.";
    }

    if (options.chunkSize < 4 || options.chunkSize > 40) {
      return "Chunk size must be between 4 and 40.";
    }

    return null;
  }, [apiKey, file, model, options.chunkSize, provider, sourceLanguage, targetLanguage]);

  const workflowState: WorkflowState = error
    ? "error"
    : hasResult
      ? "success"
      : isRunning
        ? "running"
        : !file
          ? "idle"
          : validationMessage
            ? "needs_settings"
            : "ready";

  const workflowTone = workflowState === "error" ? "error" : workflowState === "idle" || workflowState === "needs_settings" ? "warning" : "ready";
  const workflowCopy = useMemo(() => {
    switch (workflowState) {
      case "idle":
        return {
          title: "Missing information",
          message: "Upload a subtitle file to begin.",
          detail: null,
        };
      case "needs_settings":
        return {
          title: "Missing information",
          message: validationMessage ?? "Complete the required settings to continue.",
          detail: null,
        };
      case "ready":
        return {
          title: "Ready to start",
          message: "Everything is set. You can start the translation.",
          detail: null,
        };
      case "running":
        return {
          title: "Translation in progress",
          message: "Your subtitle file is being translated in contextual chunks.",
          detail: null,
        };
      case "success":
        return {
          title: "Translation complete",
          message: "Your subtitle file is ready to download.",
          detail: null,
        };
      case "error":
        return {
          title: "Translation error",
          message: "Something went wrong during translation. Review the message and try again.",
          detail: error,
        };
    }
  }, [error, validationMessage, workflowState]);

  const handleProviderChange = (value: ProviderId) => {
    setProvider(value);
    if (value === "openrouter") {
      setModel("");
    } else {
      setModel(getDefaultModelForProvider(value));
    }
  };

  const appendLog = (message: string) => {
    setActivityLog((current) => [...current, message].slice(-20));
  };

  const resetApp = () => {
    activeRequestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setFile(null);
    setProvider(DEFAULT_PROVIDER);
    setModel(DEFAULT_MODEL);
    setApiKey("");
    setSourceLanguage(DEFAULT_SOURCE_LANGUAGE);
    setTargetLanguage(DEFAULT_TARGET_LANGUAGE);
    setOptions({ ...DEFAULT_OPTIONS });
    setStage("");
    setCurrentChunk(0);
    setTotalChunks(0);
    setActivityLog([]);
    setError(null);
    setTranslatedContent(null);
    setTranslatedFileName(null);
    setIsRunning(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStop = () => {
    activeRequestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsRunning(false);
    setStage("stopped");
    appendLog("Translation stopped by user");
  };

  const handleTranslate = async () => {
    if (!file || validationMessage) {
      setError(validationMessage ?? "Please complete the form.");
      return;
    }

    setError(null);
    setTranslatedContent(null);
    setTranslatedFileName(null);
    setStage("reading file");
    setCurrentChunk(0);
    setTotalChunks(0);
    setActivityLog(["Reading subtitle file"]);
    setIsRunning(true);

    try {
      activeRequestIdRef.current += 1;
      const requestId = activeRequestIdRef.current;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const fileContent = await file.text();
      const payload = translationRequestSchema.parse({
        fileName: file.name,
        fileContent,
        provider,
        model,
        apiKey,
        sourceLanguage,
        targetLanguage,
        options,
      });

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The translation request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handleEventLine = (line: string) => {
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        if (!line.trim()) {
          return;
        }

        const event = parseStreamLine(line);

        if (event.type === "stage") {
          setStage(event.stage);
          appendLog(event.stage);
        }

        if (event.type === "chunk-progress") {
          setStage(event.stage);
          setCurrentChunk(event.chunk);
          setTotalChunks(event.totalChunks);
          appendLog(`Chunk ${event.chunk} of ${event.totalChunks}`);
        }

        if (event.type === "complete") {
          setStage("done");
          setCurrentChunk(event.totalChunks);
          setTotalChunks(event.totalChunks);
          setTranslatedContent(event.translatedContent);
          setTranslatedFileName(event.translatedFileName);
          appendLog("Translation complete");
        }

        if (event.type === "error") {
          throw new Error(event.message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          handleEventLine(line);
        }
      }

      handleEventLine(buffer);

      if (!translatedContent && !error) {
        setError("Translation ended unexpectedly without producing a result. Try again.");
        setStage("error");
      }
    } catch (unknownError) {
      if (unknownError instanceof Error && unknownError.name === "AbortError") {
        return;
      }

      const message = readFriendlyClientError(unknownError);
      setError(message);
      setStage("error");
      appendLog(`Error: ${message}`);
    } finally {
      abortControllerRef.current = null;
      setIsRunning(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <Card className="border-teal-900/10">
        <CardHeader className="pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Start your translation</CardTitle>
              <CardDescription>
                Upload your subtitle file, choose your translation settings, and start when you&apos;re ready.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">SRT preferred</Badge>
              <Badge variant="secondary">VTT supported</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-7">
          <Input
            accept=".srt,.vtt"
            disabled={isRunning}
            id="subtitle-file"
            ref={fileInputRef}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />

          <SettingsPanel
            apiKey={apiKey}
            disabled={isRunning}
            model={model}
            onApiKeyChange={setApiKey}
            onModelChange={setModel}
            onOptionsChange={setOptions}
            onProviderChange={handleProviderChange}
            onSourceLanguageChange={setSourceLanguage}
            onTargetLanguageChange={setTargetLanguage}
            options={options}
            provider={provider}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
          />

          <div
            className={`flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
              workflowTone === "error"
                ? "border-destructive/25 bg-destructive/5 text-destructive"
                : workflowTone === "warning"
                  ? "border-amber-300 bg-amber-50/70 text-amber-950"
                  : "border-teal-200 bg-teal-50/60 text-teal-950"
            }`}
          >
            <div className="max-w-xl">
              <p className="text-xs leading-5 opacity-90 sm:text-sm sm:leading-6">{workflowCopy.message}</p>
              {workflowCopy.detail ? <p className="mt-2 text-xs leading-5 opacity-80">{workflowCopy.detail}</p> : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              {isRunning ? (
                <Button className="whitespace-nowrap" onClick={handleStop} size="lg" variant="outline">
                  <OctagonX className="h-4 w-4" />
                  Stop
                </Button>
              ) : !isPristine ? (
                <Button className="whitespace-nowrap" onClick={resetApp} size="lg" variant="outline">
                  Reset
                </Button>
              ) : null}
              <Button
                className="whitespace-nowrap"
                disabled={Boolean(validationMessage) || isRunning}
                onClick={handleTranslate}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Translating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Translation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <ProgressPanel
          currentChunk={currentChunk}
          hasError={Boolean(error)}
          isComplete={hasResult}
          isRunning={isRunning}
          stage={stage}
          totalChunks={totalChunks}
        />
        <ResultPanel
          errorMessage={error}
          onReset={resetApp}
          state={
            error ? "error" : hasResult ? "complete" : isRunning ? "running" : "idle"
          }
          translatedContent={translatedContent}
          translatedFileName={translatedFileName}
        />
      </div>
    </div>
  );
}
