import type { ChunkPromptPayload } from "./types";

function getStyleInstruction(style: ChunkPromptPayload["translationStyle"]) {
  if (style === "literal") {
    return "Stay closer to the original wording, but still produce readable subtitles.";
  }

  if (style === "neutral") {
    return "Use a balanced, neutral translation style without sounding stiff.";
  }

  return "Prioritize natural subtitle phrasing that sounds like real dialogue.";
}

function getForeignDialogueInstruction(mode: ChunkPromptPayload["foreignDialogueHandling"]) {
  if (mode === "translate_italic") {
    return [
      "If spoken dialogue inside a subtitle line is in a different language than the selected source language, treat it as foreign dialogue.",
      "Translate that foreign-origin spoken content into the target language and wrap only that translated foreign-origin spoken text in <i>...</i>.",
      "Do not italicize normal translated dialogue.",
    ].join(" ");
  }

  return [
    "If spoken dialogue inside a subtitle line is in a different language than the selected source language, treat it as foreign dialogue.",
    "Keep that foreign-origin spoken content exactly as written and do not translate it.",
    "Do not italicize it unless the source already implies italics.",
  ].join(" ");
}

export function buildSystemPrompt() {
  return [
    "You are a professional audiovisual subtitle translator.",
    "Translate the current subtitle chunk while preserving conversational continuity from prior context.",
    "Never change subtitle indexes, entry boundaries, timestamps, or entry count.",
    "Never merge entries, split entries, omit entries, or invent dialogue.",
    "Preserve tone, tension, sarcasm, humor, implied meaning, and recurring names consistently.",
    "Keep subtitles concise and natural for on-screen reading.",
    "Return only JSON that matches the provided schema exactly.",
  ].join(" ");
}

export function buildChunkUserPrompt(payload: ChunkPromptPayload) {
  const contextSummary = payload.contextAware ? payload.memory.contextSummary : "";
  const glossary = payload.contextAware ? payload.memory.glossary : [];
  const preserveNamesInstruction = payload.preserveNames
    ? "Keep recurring names, titles, and honorifics stable unless there is a very strong reason not to."
    : "Translate names or honorifics only when that is clearly the natural choice in the target language.";
  const foreignDialogueInstruction = getForeignDialogueInstruction(payload.foreignDialogueHandling);
  const glossaryText =
    glossary.length === 0
      ? "No glossary yet."
      : glossary.map((term) => `- ${term.source} => ${term.target}`).join("\n");

  return `
Translate the subtitle entries below.

Source language: ${payload.sourceLanguage}
Target language: ${payload.targetLanguage}
Translation style: ${payload.translationStyle}
Style instruction: ${getStyleInstruction(payload.translationStyle)}
Preserve names and honorifics: ${payload.preserveNames ? "Yes" : "No"}
Context-aware translation: ${payload.contextAware ? "Yes" : "No"}
Foreign dialogue handling: ${payload.foreignDialogueHandling}

Rolling context summary from previous chunks:
${contextSummary || "No previous summary yet."}

Glossary / terminology memory:
${glossaryText}

Rules:
- Translate each subtitle entry using nearby dialogue context, not in isolation.
- Keep each translation aligned to its original subtitle index.
- Do not include timestamps in the translation output.
- Keep translated text concise enough for subtitles.
- Preserve line breaks inside an entry when they help readability.
- ${preserveNamesInstruction}
- The selected source language is the main language of the subtitle file.
- ${foreignDialogueInstruction}
- Accessibility and context tags like [ON PHONE], [WHISPERS], [IN ITALIAN] may still be translated into the target language.
- Update the context summary briefly for the next chunk.
- Only include glossary updates when they help future consistency.

Examples for foreign dialogue handling:
- Source English, target Spanish.
- Subtitle text: "Pronto."
- In preserve mode: "Pronto."
- In translate_italic mode: "<i>¿Diga?</i>"

Current chunk entries:
${JSON.stringify(
    payload.chunk.map((entry) => ({
      index: entry.index,
      text: entry.text,
    })),
    null,
    2,
  )}
`.trim();
}

export function buildRepairPrompt(rawOutput: string, validationIssue: string) {
  return `
Repair the following model output so it matches the required JSON schema exactly.
Do not add explanation.

Validation issue:
${validationIssue}

Broken output:
${rawOutput}
`.trim();
}
