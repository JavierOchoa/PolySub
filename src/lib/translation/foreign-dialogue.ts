import type { TranslationRequest } from "./types";

const COMMON_SHORT_UTTERANCES: Partial<Record<string, Set<string>>> = {
  english: new Set([
    "yes",
    "no",
    "ok",
    "okay",
    "hello",
    "hi",
    "hey",
    "thanks",
    "sorry",
    "please",
    "wait",
    "help",
    "goodbye",
    "bye",
    "what",
    "who",
    "why",
    "where",
    "when",
    "come",
    "go",
    "stop",
    "hurry",
    "fine",
    "good",
    "sure",
    "right",
    "really",
  ]),
  spanish: new Set([
    "si",
    "sí",
    "no",
    "hola",
    "gracias",
    "perdon",
    "perdón",
    "espera",
    "vamos",
    "oye",
    "bien",
    "claro",
    "adios",
    "adiós",
  ]),
  french: new Set(["oui", "non", "bonjour", "salut", "merci", "pardon", "attends", "allez", "bien"]),
  italian: new Set(["si", "sì", "no", "ciao", "grazie", "scusa", "aspetta", "bene", "andiamo"]),
  german: new Set(["ja", "nein", "hallo", "danke", "bitte", "warte", "gut", "komm", "los"]),
  portuguese: new Set(["sim", "nao", "não", "ola", "olá", "obrigado", "espera", "vamos", "bem"]),
};

function normalizeLanguageKey(language: string) {
  return language.trim().toLowerCase().split(" ")[0] ?? "";
}

function stripHtml(text: string) {
  return text.replace(/<\/?i>/g, "").trim();
}

function tokenizeUtterance(text: string) {
  return text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
}

function tokenizeRawUtterance(text: string) {
  return text.match(/[\p{L}']+/gu) ?? [];
}

function isShortStandaloneUtterance(text: string) {
  const cleaned = stripHtml(text);

  if (!cleaned || cleaned.includes("\n")) {
    return false;
  }

  if (/[\[\]{}<>]/.test(cleaned)) {
    return false;
  }

  const tokens = tokenizeUtterance(cleaned);

  return tokens.length >= 1 && tokens.length <= 2 && cleaned.length <= 18;
}

function looksLikeKnownSourceUtterance(text: string, sourceLanguage: string) {
  const sourceWords = COMMON_SHORT_UTTERANCES[normalizeLanguageKey(sourceLanguage)];

  if (!sourceWords) {
    return true;
  }

  const tokens = tokenizeUtterance(text);
  const rawTokens = tokenizeRawUtterance(text);

  if (tokens.length === 0) {
    return true;
  }

  const hasKnownSourceWord = tokens.some((token) => sourceWords.has(token));

  if (!hasKnownSourceWord) {
    return false;
  }

  return tokens.every((token, index) => {
    if (sourceWords.has(token)) {
      return true;
    }

    const rawToken = rawTokens[index] ?? "";
    return /^[A-Z][\p{L}']+$/u.test(rawToken);
  });
}

export function applyForeignDialogueSafeguard(
  originalText: string,
  translatedText: string,
  request: TranslationRequest,
) {
  if (request.options.foreignDialogueHandling !== "preserve") {
    return translatedText;
  }

  if (!isShortStandaloneUtterance(originalText)) {
    return translatedText;
  }

  if (looksLikeKnownSourceUtterance(originalText, request.sourceLanguage)) {
    return translatedText;
  }

  if (stripHtml(originalText).toLowerCase() === stripHtml(translatedText).toLowerCase()) {
    return translatedText;
  }

  return originalText;
}
