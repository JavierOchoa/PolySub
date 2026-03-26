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
        <CardDescription>Download the finished subtitle file here when translation is complete.</CardDescription>
      </CardHeader>
      <CardContent>
        {translatedContent && translatedFileName ? (
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-teal-950">Translation finished successfully</p>
                  <p className="mt-1 text-sm font-medium text-teal-950/85">{translatedFileName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ready to download. The app rebuilt the subtitle file using the original timing data and structure.
                  </p>
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
          <div className="rounded-2xl border border-dashed bg-white/70 p-6">
            <p className="text-sm font-semibold text-teal-950">No translated file yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Upload a subtitle file, complete the settings, and start the translation. When it finishes, the download button will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
