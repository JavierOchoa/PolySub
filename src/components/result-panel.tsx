"use client";

import { Download, FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ResultPanelProps = {
  isRunning: boolean;
  onReset: () => void;
  translatedContent: string | null;
  translatedFileName: string | null;
};

export function ResultPanel({ isRunning, onReset, translatedContent, translatedFileName }: ResultPanelProps) {
  const handleDownload = () => {
    if (!translatedContent || !translatedFileName) {
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
        <CardDescription>Your translated file will appear here when ready.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {translatedContent && translatedFileName ? (
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-teal-950">Translation complete. Your subtitle file is ready to download.</p>
                  <p className="mt-1 text-sm font-medium text-teal-950/85">{translatedFileName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={onReset} variant="outline">
                  Reset
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download File
                </Button>
              </div>
            </div>
          </div>
        ) : isRunning ? (
          <div className="rounded-2xl border border-dashed bg-white/80 p-6 text-sm text-muted-foreground">
            Translation is running. Your download will appear here automatically when the last chunk finishes.
          </div>
        ) : (
          <p className="text-xs leading-6 text-muted-foreground/80">No translated file yet. Start a translation to generate one.</p>
        )}
      </CardContent>
    </Card>
  );
}
