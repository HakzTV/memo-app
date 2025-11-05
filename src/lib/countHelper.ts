// src/helpers/getCountFor.ts

import { Account, Query } from "appwrite";
import client, { databases } from "./appwrite";


// type SampleItem = { status?: string };
// type SampleShape = {
//   total?: number;
//   items?: SampleItem[];
// };
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const MEMO_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MEMOS_COLLECTION_ID;

/**
 * Default allowed statuses (global)
 * You can customise per-page via `PAGE_ALLOWED_STATUSES`.
 */
const GLOBAL_ALLOWED_STATUSES = [
  "draft",
  "final-draft",
  "review",
  "sent",
  "dispatched",
  "inbox",
  "progress",
  "archived",
  "replied",
  "responded",
  "read",
  "unread",
  "review",
  "sent",
  "In Progress inbox",
  "inbox",
  "progress",
  "Draft Review",
  "replied",
  "responded",
];

/**
 * Optional per-page allowed statuses override.
 * Example:
 * { drafts: ["draft","review"], inbox: ["progress","replied"] }
 * If a pageId is present here, it will be used instead of GLOBAL_ALLOWED_STATUSES.
 */
export const PAGE_ALLOWED_STATUSES: Record<string, string[]> = {
  // Example; edit to match your product rules
  drafts: ["draft", "Draft Review", "final-draft"],
  inbox: ["In Progress inbox", "replied", "inbox"],
  sent: ["In Progress-Sent", "dispatched"],
  copied: ["read", "unread"],
  bcc: ["unread", "read"],
  
};

/**
 * Whether items with missing status should be counted.
 * - true = count items even if item.status is undefined
 * - false = only count items with a defined status that matches allowed list
 *
 * Default: true to avoid "0" counts when data lacks statuses.
 */
const DEFAULT_COUNT_UNDEFINED = true;

const normalize = (s: string) => s.toLowerCase().trim();

/**
 * Get counts for all pages.
 * Options:
 * - countUndefined: whether to include items missing status (default true)
 * - pageAllowedOverrides: optional per-page allowed status map (defaults to PAGE_ALLOWED_STATUSES)
 */


export async function getAllPageCounts(options?: {
  countUndefined?: boolean;
  pageAllowedOverrides?: Record<string, string[]>;
}): Promise<Record<string, number>> {
  const result: Record<string, number> = {
    drafts: 0,
    inbox: 0,
    sent: 0,
    copied: 0,
    bcc: 0,
  };

  const countUndefined = options?.countUndefined ?? DEFAULT_COUNT_UNDEFINED;
  const pageOverrides = options?.pageAllowedOverrides ?? PAGE_ALLOWED_STATUSES;

  try {
    if (!DATABASE_ID || !MEMO_COLLECTION_ID) {
      console.warn("⚠️ Missing Appwrite environment variables");
      return result;
    }

    const account = new Account(client);
    const user = await account.get();

    console.debug("[getAllPageCounts] currentUser:", user.$id);

    const res = await databases.listDocuments(DATABASE_ID, MEMO_COLLECTION_ID, [
      Query.equal("owner", user.$id),
      Query.limit(1000),
    ]);

    const memos = res.documents.map((doc) => ({
      status: doc.status ?? "",
    }));

    // For each page (drafts, inbox, sent, copied, bcc)
    for (const [pageId, allowedStatuses] of Object.entries(pageOverrides)) {
      const allowed = allowedStatuses.map((s) => normalize(s));

      const filtered = memos.filter((m) => {
        if (!m.status) return countUndefined;
        const normalized = normalize(m.status);
        return allowed.includes(normalized);
      });

      result[pageId] = filtered.length;
    }
   // Keep original behavior: iterate pageOverrides keys (so Sidebar mapping unchanged)
    Object.keys(pageOverrides).forEach((pageId) => {
      const allowed = (pageOverrides[pageId] ?? GLOBAL_ALLOWED_STATUSES).map((s) => normalize(s));

      const filtered = memos.filter((it) => {
        if (!it.status) return countUndefined;
        const normalized = normalize(it.status);
        return allowed.includes(normalized);
      });

      result[pageId] = filtered.length;
    });

    console.debug("[getAllPageCounts] Final counts:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to get memo counts from Appwrite:", error);
    return result;
  }
}


/** convenience wrapper */
export async function getCountForPage(pageId: string, opts?: { countUndefined?: boolean }): Promise<number> {
  const all = await getAllPageCounts({ countUndefined: opts?.countUndefined });
  return all[pageId] ?? 0;
}