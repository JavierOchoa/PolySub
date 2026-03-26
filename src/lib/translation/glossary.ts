import type { GlossaryTerm } from "./types";

export function mergeGlossary(existing: GlossaryTerm[], updates: GlossaryTerm[]) {
  const map = new Map<string, GlossaryTerm>();

  for (const term of existing) {
    map.set(term.source.toLowerCase(), term);
  }

  for (const term of updates) {
    const cleanedTerm = {
      source: term.source.trim(),
      target: term.target.trim(),
    };

    if (!cleanedTerm.source || !cleanedTerm.target) {
      continue;
    }

    map.set(cleanedTerm.source.toLowerCase(), cleanedTerm);
  }

  return Array.from(map.values()).slice(0, 30);
}
