import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProgressPanelProps = {
  isRunning: boolean;
  isComplete: boolean;
  stage: string;
  currentChunk: number;
  totalChunks: number;
  events: string[];
};

export function ProgressPanel({ isRunning, isComplete, stage, currentChunk, totalChunks, events }: ProgressPanelProps) {
  const statusLabel = isRunning ? "Running" : isComplete ? "Complete" : "Waiting";
  const progressWidth =
    totalChunks > 0 ? `${Math.max((currentChunk / totalChunks) * 100, isRunning ? 6 : 0)}%` : "0%";

  return (
    <Card className="border-teal-900/10">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Follow each stage from parsing to final file rebuild.</CardDescription>
          </div>
          <Badge variant={isRunning || isComplete ? "default" : "outline"}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-teal-950">Current Stage</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stage || "Waiting for you to start a translation."}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {totalChunks > 0 ? (
                <>
                  <p className="font-semibold text-teal-950">
                    {currentChunk}/{totalChunks}
                  </p>
                  <p>chunks</p>
                </>
              ) : (
                <p>No chunks yet</p>
              )}
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: progressWidth }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1">1. Parse file</span>
            <span className="rounded-full bg-secondary px-3 py-1">2. Prepare chunks</span>
            <span className="rounded-full bg-secondary px-3 py-1">3. Translate with context</span>
            <span className="rounded-full bg-secondary px-3 py-1">4. Rebuild file</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold text-teal-950">Activity Log</p>
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
                No activity yet. Once you start a translation, this area will show the current stage and chunk progress.
              </div>
            ) : (
              events.map((event, index) => (
                <div key={`${event}-${index}`} className="rounded-xl bg-secondary/60 px-3 py-2 text-sm text-teal-950">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
