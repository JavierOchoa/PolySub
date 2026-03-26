import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "@/app/api/translate/route";
import { anthropicAdapter } from "@/lib/providers/anthropic";
import { googleAdapter } from "@/lib/providers/google";
import { applyForeignDialogueSafeguard } from "@/lib/translation/foreign-dialogue";
import { buildChunkUserPrompt } from "@/lib/translation/prompts";
import { translateSubtitles } from "@/lib/translation/orchestrator";

const SAMPLE_REQUEST = {
  fileName: "scene.srt",
  fileContent: `1
00:00:01,000 --> 00:00:03,000
Hello, Maria.

2
00:00:03,500 --> 00:00:05,000
We have to go now.`,
  provider: "openai" as const,
  model: "gpt-5.4",
  apiKey: "test-key",
  sourceLanguage: "English",
  targetLanguage: "Spanish",
  options: {
    preserveNames: true,
    contextAware: true,
    foreignDialogueHandling: "preserve" as const,
    translationStyle: "natural" as const,
    chunkSize: 10,
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function readStreamResponse(response: Response) {
  assert.ok(response.body);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    result += decoder.decode(value, { stream: true });
  }

  return result
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("route streams a complete translated subtitle file", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    jsonResponse({
      choices: [
        {
          message: {
            content: JSON.stringify({
              translations: [
                { index: 1, translated_text: "Hola, Maria." },
                { index: 2, translated_text: "Tenemos que irnos ahora." },
              ],
              context_summary: "Two people are leaving quickly.",
              glossary_updates: [{ source: "Maria", target: "Maria" }],
            }),
          },
        },
      ],
    });

  try {
    const response = await POST(
      new Request("http://localhost:3000/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(SAMPLE_REQUEST),
      }),
    );

    const events = await readStreamResponse(response);
    const completeEvent = events.find((event) => event.type === "complete");

    assert.ok(completeEvent);
    assert.match(completeEvent.translatedContent, /Hola, Maria\./);
    assert.match(completeEvent.translatedContent, /Tenemos que irnos ahora\./);
    assert.equal(completeEvent.translatedFileName, "scene.es.srt");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("translateSubtitles repairs a malformed provider response once", async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async () => {
    callCount += 1;

    if (callCount === 1) {
      return jsonResponse({
        choices: [
          {
            message: {
              content: "{\"translations\":[{\"index\":1,\"translated_text\":\"Hola, Maria.\"}]}",
            },
          },
        ],
      });
    }

    return jsonResponse({
      choices: [
        {
          message: {
            content: JSON.stringify({
              translations: [
                { index: 1, translated_text: "Hola, Maria." },
                { index: 2, translated_text: "Tenemos que irnos ahora." },
              ],
              context_summary: "They leave in a hurry.",
              glossary_updates: [{ source: "Maria", target: "Maria" }],
            }),
          },
        },
      ],
    });
  };

  try {
    const events = [];

    for await (const event of translateSubtitles(SAMPLE_REQUEST)) {
      events.push(event);
    }

    const completeEvent = events.find((event) => event.type === "complete");
    assert.equal(callCount, 2);
    assert.ok(completeEvent && "translatedContent" in completeEvent);
    assert.match(completeEvent.translatedContent, /Hola, Maria\./);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Anthropic and Google adapters normalize structured output correctly", async () => {
  const originalFetch = globalThis.fetch;
  let currentProvider: "anthropic" | "google" = "anthropic";

  globalThis.fetch = async () => {
    if (currentProvider === "anthropic") {
      return jsonResponse({
        content: [
          {
            type: "tool_use",
            input: {
              translations: [{ index: 1, translated_text: "Hola." }],
              context_summary: "A greeting.",
              glossary_updates: [],
            },
          },
        ],
      });
    }

    return jsonResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  translations: [{ index: 1, translated_text: "Hola." }],
                  context_summary: "A greeting.",
                  glossary_updates: [],
                }),
              },
            ],
          },
        },
      ],
    });
  };

  try {
    const anthropicResult = await anthropicAdapter.translateJson({
      apiKey: "test",
      model: "claude-sonnet-4-6",
      systemPrompt: "system",
      userPrompt: "user",
      jsonSchema: {},
    });

    assert.deepEqual(anthropicResult.data, {
      translations: [{ index: 1, translated_text: "Hola." }],
      context_summary: "A greeting.",
      glossary_updates: [],
    });

    currentProvider = "google";

    const googleResult = await googleAdapter.translateJson({
      apiKey: "test",
      model: "gemini-2.5-flash",
      systemPrompt: "system",
      userPrompt: "user",
      jsonSchema: {},
    });

    assert.equal(typeof googleResult.data, "string");
    assert.match(String(googleResult.data), /Hola\./);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("prompt includes preserve-mode foreign dialogue instructions", () => {
  const prompt = buildChunkUserPrompt({
    chunk: [{ index: 1, startTime: "00:00:01,000", endTime: "00:00:02,000", text: "Pronto." }],
    sourceLanguage: "English",
    targetLanguage: "Spanish",
    preserveNames: true,
    translationStyle: "natural",
    contextAware: true,
    foreignDialogueHandling: "preserve",
    memory: {
      contextSummary: "",
      glossary: [],
    },
  });

  assert.match(prompt, /Foreign dialogue handling: preserve/);
  assert.match(prompt, /In preserve mode: "Pronto\."/);
});

test("prompt includes translate-and-italicize foreign dialogue instructions", () => {
  const prompt = buildChunkUserPrompt({
    chunk: [{ index: 1, startTime: "00:00:01,000", endTime: "00:00:02,000", text: "Pronto." }],
    sourceLanguage: "English",
    targetLanguage: "Spanish",
    preserveNames: true,
    translationStyle: "natural",
    contextAware: true,
    foreignDialogueHandling: "translate_italic",
    memory: {
      contextSummary: "",
      glossary: [],
    },
  });

  assert.match(prompt, /Foreign dialogue handling: translate_italic/);
  assert.match(prompt, /<i>¿Diga\?<\/i>/);
});

test("preserve-mode safeguard keeps very short likely-foreign utterances unchanged", () => {
  const result = applyForeignDialogueSafeguard("Pronto.", "¿Diga?", SAMPLE_REQUEST);

  assert.equal(result, "Pronto.");
});

test("preserve-mode safeguard does not override common short source-language utterances", () => {
  const result = applyForeignDialogueSafeguard("Hello.", "Hola.", SAMPLE_REQUEST);

  assert.equal(result, "Hola.");
});

test("translate_italic mode bypasses the preserve safeguard", () => {
  const result = applyForeignDialogueSafeguard("Pronto.", "<i>¿Diga?</i>", {
    ...SAMPLE_REQUEST,
    options: {
      ...SAMPLE_REQUEST.options,
      foreignDialogueHandling: "translate_italic",
    },
  });

  assert.equal(result, "<i>¿Diga?</i>");
});
