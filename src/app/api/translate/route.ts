import { NextResponse } from "next/server";

import { translateSubtitles } from "@/lib/translation/orchestrator";
import { translationRequestSchema } from "@/lib/translation/types";
import { AppError, getErrorMessage } from "@/lib/utils/errors";

export const runtime = "nodejs";

type StreamEvent =
  | { type: "stage"; stage: string }
  | { type: "chunk-progress"; chunk: number; totalChunks: number; stage: string }
  | {
      type: "complete";
      translatedContent: string;
      translatedFileName: string;
      format: "srt" | "vtt";
      totalChunks: number;
    }
  | { type: "error"; message: string };

function encodeEvent(event: StreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedRequest = translationRequestSchema.parse(body);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Security note: the user's API key is used only inside this request
          // and is never persisted or written to logs.
          // The response is streamed line by line so the browser can update
          // the progress UI while chunks are being processed.
          for await (const event of translateSubtitles(parsedRequest)) {
            controller.enqueue(encoder.encode(encodeEvent(event)));
          }
        } catch (error) {
          const message = getErrorMessage(error);
          controller.enqueue(encoder.encode(encodeEvent({ type: "error", message })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const statusCode = error instanceof AppError ? error.statusCode : 400;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
