// src/props/PillProps.ts
import type { ComponentType, SVGProps } from "react";
import type { ContentItem } from "./MainContentProps";
import { DocumentSquare16Regular, Chat16Regular, CheckmarkCircle16Regular, Clock16Regular } from "@fluentui/react-icons";

export type Pill = {
  id: string;                    // unique id
  label: string;                 // display label
  icon: ComponentType<SVGProps<SVGSVGElement>>;
         // optional icon
  appliesTo?: string[];          // pageIds where this pill should appear
  showAvatar?: boolean;          // whether content items show avatar when this pill active
  match?: (item: ContentItem) => boolean; // optional custom matcher (item => boolean)
  className?: string;            // optional styles
};

/**
 * SINGLE default pills list that contains pills for all pages.
 * - Use `appliesTo` to control which sidebar pages each pill belongs to.
 * - Provide match() if you need a custom filter for that pill.
 */
export const DEFAULT_PILLS: Pill[] = [
  // Inbox page: Unassigned (final-draft) and Replied
  {
    id: "unassigned",
    label: "New",
    icon: DocumentSquare16Regular,
    appliesTo: ["inbox"],
    showAvatar: true,
    match: (item) => {
      const s = (item.status ?? "").toLowerCase();
      return s.includes("progress") || s.includes("inbox");
    },
  },
  {
    id: "replied",
    label: "Replied To",
    icon: Chat16Regular,
    appliesTo: ["inbox"],
    showAvatar: true,
    match: (item) => {
      const s = (item.status ?? "").toLowerCase();
      return s.includes("replied") || s.includes("reply") || s.includes("responded");
    },
  },

  // Drafts page: Drafts (draft-review) and My Drafts
  {
    id: "draft",
    label: "Unassigned",
    icon: DocumentSquare16Regular,
    appliesTo: ["drafts"],
    showAvatar: false,
    match: (item) => {
      const s = (item.status ?? "").toLowerCase();
      if (s.includes("final")) return false;
      return s.includes("final") || s.includes("review") || s.includes("work-in-progress");
    },
  },
  {
    id: "my-drafts",
    label: "Drafts",
    icon: Clock16Regular,
    appliesTo: ["drafts"],
    showAvatar: false,
    // example custom match: authored by current user — implement real user check in app if needed
    // match: (item) => Boolean(item.memoAuthor && item.memoAuthor?.name && item.memoAuthor?.name === "Current User"),
      match: (item) => {
      const s = (item.status ?? "").toLowerCase();
      if (s.includes("review")) return false;
      return s.includes("draft") || s.includes("review") || s.includes("work-in-progress");
    },
  },

  // Sent page: Sent & Archived
  {
    id: "sent",
    label: "Sent Memos",
    icon: CheckmarkCircle16Regular,
    appliesTo: ["sent"],
    showAvatar: false,
    match: (item) => {
      const s = (item.status ?? "").toLowerCase();
      return s.includes("sent") || s.includes("dispatched");
    },
  },
  {
    id: "archived",
    label: "Archived",
    icon: DocumentSquare16Regular,
    appliesTo: ["sent"],
    showAvatar: false,
    match: (item) => (item.status ?? "").toLowerCase().includes("archiv"),
  },

  // Copied page fallback
  {
    id: "copied",
    label: "Unread",
    icon: DocumentSquare16Regular,
    appliesTo: ["copied"],
    showAvatar: true,
    match: (item) => {
      const s = (item.status ?? "").toLowerCase();
      if (s.includes("review")) return false;
      return s.includes("unread");
    },
  },
  
  {
    id: "copied-second",
    label: "Read",
    icon: DocumentSquare16Regular,
    appliesTo: ["copied"],
    showAvatar: true,
  },
    {
    id: "bcc",
    label: "Unread",
    icon: DocumentSquare16Regular,
    appliesTo: ["bcc"],
    showAvatar: true,
  },
    {
    id: "bcc-second",
    label: "Read",
    icon: DocumentSquare16Regular,
    appliesTo: ["bcc"],
    showAvatar: true,
  },
  // Global fallback pill (applies everywhere if no page-specific match)
  {
    id: "all",
    label: "All",
    icon: DocumentSquare16Regular,
    appliesTo: undefined, // undefined means global / fallback
    showAvatar: false,
  }
];
