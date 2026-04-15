import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProgressPanelProps = {
  isRunning: boolean;
  isComplete: boolean;
  hasError: boolean;
  stage: string;
  currentChunk: number;
  totalChunks: number;
};

export function ProgressPanel({ isRunning, isComplete, hasError, stage, currentChunk, totalChunks }: ProgressPanelProps) {
  const statusLabel = hasError ? "Error" : isRunning ? "Running" : isComplete ? "Complete" : "Waiting";
  const progressWidth =
    totalChunks > 0 ? `${Math.max((currentChunk / totalChunks) * 100, isRunning ? 6 : 0)}%` : "0%";
  const normalizedStage = stage.toLowerCase();
  const activeStep = isComplete
    ? 4
    : normalizedStage.includes("rebuilding") || normalizedStage === "done"
      ? 4
      : normalizedStage.includes("translating")
        ? 3
        : normalizedStage.includes("preparing")
          ? 2
          : normalizedStage.includes("reading") || normalizedStage.includes("parsing")
            ? 1
            : 0;
  const steps = [
    { index: 1, label: "1. Parse file" },
    { index: 2, label: "2. Prepare chunks" },
    { index: 3, label: "3. Translate with context" },
    { index: 4, label: "4. Rebuild file" },
  ];

  return (
    <Card className="border-teal-900/10">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Track each step as the app parses, translates, and rebuilds your subtitle file.</CardDescription>
          </div>
          {hasError || isRunning || isComplete ? <Badge variant="default">{statusLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          {totalChunks > 0 ? (
            <div className="mb-3 text-right text-sm text-muted-foreground">
              <p className="font-semibold text-teal-950">
                {currentChunk}/{totalChunks}
              </p>
              <p>chunks</p>
            </div>
          ) : null}
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all ${hasError ? "bg-destructive" : "bg-primary"}`}
              style={{ width: progressWidth }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {steps.map((step) => {
              const isActive = step.index === activeStep;
              const isCompleted = step.index < activeStep || isComplete;

              return (
                <span
                  key={step.index}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-primary/15 text-teal-950"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
