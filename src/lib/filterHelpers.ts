// src/lib/filterHelpers.ts
import type { Pill } from "../props/PillProps";
import type { ContentItem } from "../props/MainContentProps";

/**
 * Default status matching rules:
 * - unassigned -> items whose status includes both 'final' and 'draft' (e.g. 'final-draft')
 * - draft -> items containing 'draft' but not 'final', or statuses containing 'review'
 */
export const matchesFilter = (status: string | undefined, filterId: string): boolean => {
  if (!status) return false;
  const s = status.toLowerCase();

 

  // fallback: match when status includes filterId substring
  return s.includes(filterId);
};

/**
 * Filter items array by pillId. If pill has custom match(), use that.
 */
export const filterItems = (items: ContentItem[], pillId: string, pills?: Pill[]): ContentItem[] => {
  if (!Array.isArray(items)) return [];

  const pill = pills?.find((p) => p.id === pillId);

  if (pill?.match) {
    // custom matcher provided on pill
    return items.filter((it) => {
      try {
        return !!pill.match!(it);
      } catch {
        return false;
      }
    });
  }

  // default match by status
  return items.filter((it) => matchesFilter(it.status, pillId));
};
