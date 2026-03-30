"use client";

import { Download, FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultState = "idle" | "running" | "complete" | "error";

type ResultPanelProps = {
  state: ResultState;
  onReset: () => void;
  translatedContent: string | null;
  translatedFileName: string | null;
};

const STATE_COPY: Record<ResultState, { title: string; detail: string }> = {
  idle: {
    title: "No translated file yet.",
    detail: "Run a translation to enable download.",
  },
  running: {
    title: "Translation in progress.",
    detail: "Your file will be available here when it finishes.",
  },
  complete: {
    title: "Translation complete.",
    detail: "Your subtitle file is ready to download.",
  },
  error: {
    title: "Translation failed.",
    detail: "Fix the issue and try again.",
  },
};

export function ResultPanel({ state, onReset, translatedContent, translatedFileName }: ResultPanelProps) {
  const canDownload = Boolean(translatedContent && translatedFileName);
  const statusCopy = STATE_COPY[state];

  const handleDownload = () => {
    if (!canDownload || !translatedContent || !translatedFileName) {
      return;
    }

    const blob = new Blob([translatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = translatedFileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Card className="border-teal-900/10">
      <CardHeader>
        <CardTitle>Results</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="rounded-2xl border bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              {state === "complete" ? <FileCheck2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-teal-950">{statusCopy.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{statusCopy.detail}</p>
              {state === "complete" && translatedFileName ? (
                <p className="text-xs font-medium text-teal-950/80">{translatedFileName}</p>
              ) : null}
            </div>
          </div>

          {state === "complete" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button disabled={!canDownload} onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download Translated File
              </Button>
              <Button onClick={onReset} variant="outline">
                Reset
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
