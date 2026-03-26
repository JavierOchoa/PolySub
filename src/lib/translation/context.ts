const MAX_CONTEXT_LENGTH = 800;

export function clampContextSummary(summary: string) {
  const normalized = summary.trim();

  if (normalized.length <= MAX_CONTEXT_LENGTH) {
    return normalized;
  }

  return normalized.slice(0, MAX_CONTEXT_LENGTH).trimEnd();
}
