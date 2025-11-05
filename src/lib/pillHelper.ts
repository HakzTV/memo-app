import type { Pill } from "../props/PillProps";
import { DEFAULT_PILLS } from "../props/PillProps";

/**
 * Returns pills that apply to a given pageId.
 * If no pills explicitly match, it returns fallback pills (appliesTo: undefined).
 */
export const getPillsForPage = (pageId: string): Pill[] => {
  // get pills whose appliesTo includes the pageId
  const matched = DEFAULT_PILLS.filter(
    (p) => !p.appliesTo || p.appliesTo.includes(pageId)
  );

  // fallback: if no pills matched, just return global ones (appliesTo undefined)
  if (matched.length === 0) {
    return DEFAULT_PILLS.filter((p) => !p.appliesTo);
  }

  return matched;
};
