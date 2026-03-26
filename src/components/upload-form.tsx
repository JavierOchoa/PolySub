"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

import { ProgressPanel } from "@/components/progress-panel";
import { ResultPanel } from "@/components/result-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
const DEFAULT_TARGET_LANGUAGE = "Spanish";
const DEFAULT_OPTIONS: TranslationRequest["options"] = {
  preserveNames: true,
  contextAware: true,
  foreignDialogueHandling: "preserve",
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

    if (options.chunkSize < 4 || options.chunkSize > 40) {
      return "Chunk size must be between 4 and 40.";
    }

    return null;
  }, [apiKey, file, model, options.chunkSize, provider, sourceLanguage, targetLanguage]);

  const statusTone = error ? "error" : hasResult ? "success" : validationMessage ? "warning" : "ready";
  const statusMessage = error
    ? error
    : hasResult
      ? "Your translated subtitle file is ready to download."
      : validationMessage
        ? validationMessage
        : "Everything looks ready. Start the translation when you are ready.";

  const handleProviderChange = (value: ProviderId) => {
    setProvider(value);
    setModel(getDefaultModelForProvider(value));
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
              <CardTitle>Translation Setup</CardTitle>
              <CardDescription>
                Upload your subtitle file, choose a provider, paste your own API key, and download the translated file when it finishes.
              </CardDescription>
            </div>
            <Badge variant="secondary">Browser-first MVP</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 1</p>
              <p className="mt-2 text-sm font-semibold text-teal-950">Upload subtitle file</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Start with an SRT file. VTT is also accepted.</p>
            </div>
            <div className="rounded-2xl border bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 2</p>
              <p className="mt-2 text-sm font-semibold text-teal-950">Choose translation settings</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Pick your provider, model, languages, and optional style settings.</p>
            </div>
            <div className="rounded-2xl border bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 3</p>
              <p className="mt-2 text-sm font-semibold text-teal-950">Run and download</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">The app translates in contextual chunks and rebuilds the subtitle file for you.</p>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border bg-white/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-950">Subtitle File</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Upload the subtitle file you want to translate. The app keeps the original timestamps and entry order.
                </p>
              </div>
              <div className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-teal-950 sm:block">
                SRT preferred
              </div>
            </div>
            <Label htmlFor="subtitle-file">Subtitle File</Label>
            <div className="rounded-3xl border border-dashed border-teal-900/20 bg-white/70 p-5">
              <Input
                accept=".srt,.vtt"
                disabled={isRunning}
                id="subtitle-file"
                ref={fileInputRef}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-teal-950">
                  <FileText className="h-4 w-4" />
                  {file ? file.name : "No file selected"}
                </span>
                <span>{file ? "File selected and ready for validation." : "SRT is the main MVP format. VTT also works."}</span>
              </div>
            </div>
          </div>

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
            className={`rounded-2xl border px-4 py-4 ${
              statusTone === "error"
                ? "border-destructive/25 bg-destructive/5 text-destructive"
                : statusTone === "success"
                  ? "border-teal-300 bg-teal-50 text-teal-950"
                  : statusTone === "warning"
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-teal-200 bg-teal-50/70 text-teal-950"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {statusTone === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : statusTone === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {statusTone === "error"
                    ? "Something needs attention"
                    : statusTone === "success"
                      ? "Translation complete"
                      : statusTone === "warning"
                        ? "Almost ready"
                        : "Ready to start"}
                </p>
                <p className="mt-1 text-sm leading-6 opacity-90">{statusMessage}</p>
              </div>
            </div>
          </div>

          {error ? (
            <Alert className="border-destructive/25 bg-destructive/5 text-destructive">
              <AlertTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Translation Error
              </AlertTitle>
              <AlertDescription>
                {error} Check the provider, model, API key, and subtitle file, then try again.
              </AlertDescription>
            </Alert>
          ) : null}

          {validationMessage && !error ? (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950">
              <AlertTitle>Missing Information</AlertTitle>
              <AlertDescription>{validationMessage} The translate button will unlock automatically once everything is filled in.</AlertDescription>
            </Alert>
          ) : null}

          {hasResult && !error ? (
            <Alert className="border-teal-300 bg-teal-50 text-teal-950">
              <AlertTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Translation Ready
              </AlertTitle>
              <AlertDescription>
                Your translated subtitle file is ready. Use the download button in the Results panel.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-4 rounded-3xl border bg-amber-50/45 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              The app keeps your subtitle timing data in code, sends only the chunk text and indexes to the model, and rebuilds the final file itself after translation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={resetApp} size="lg" variant="outline">
                Reset
              </Button>
              <Button disabled={Boolean(validationMessage) || isRunning} onClick={handleTranslate} size="lg">
                {isRunning ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Translating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Begin Translation
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
          events={activityLog}
          isComplete={hasResult}
          isRunning={isRunning}
          stage={stage}
          totalChunks={totalChunks}
        />
        <ResultPanel
          isRunning={isRunning}
          onReset={resetApp}
          translatedContent={translatedContent}
          translatedFileName={translatedFileName}
        />
      </div>
    </div>
  );
}
