import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ContentItem } from "../props/MainContentProps";
import {  ArrowClockwise24Regular, ArrowSort24Regular, Filter24Regular } from "@fluentui/react-icons";
import { formatDisplayDate, truncateText } from "../lib/utlity";

type Props = {
    items: ContentItem[];
    selectedId?: string | null;
    onSelect?: (item: ContentItem) => void;
    className?: string;
  onRefresh: () => Promise<void> | void;
    
    /** optional columns config in future; kept simple now */
};



export default function MemoTable({ items, selectedId, onSelect, className = "" , onRefresh }: Props) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [isHiding, setIsHiding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);

    const ITEMS_PER_PAGE = 2; // per user's request: max 2 items per page

    // Deduplicate items by id, keeping the first occurrence for each non-null id.
    const uniqueItems = useMemo((): ContentItem[] => {
        const seen = new Set<string | number>();
        const out: ContentItem[] = [];
        for (const it of items) {
            const id = it.id;
            // If id is null/undefined, treat as no-id and keep the item (can't dedupe)
            if (id == null) {
                out.push(it);
                continue;
            }
            if (!seen.has(id)) {
                seen.add(id);
                out.push(it);
            }
        }
        return out;
    }, [items]);

    const handleKey = (e: React.KeyboardEvent<HTMLTableRowElement>, item: ContentItem) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(item);
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        // Return a shallow copy when there's no query so we don't return the original props array by reference.
        if (!q) return uniqueItems.slice();
        return uniqueItems.filter((it: ContentItem) => {
            const title = it.title ?? "";
            if (String(title).toLowerCase().includes(q)) return true;

            // support tags as string or string[] if present
            const tagsVal = it.tags;
            if (Array.isArray(tagsVal)) {
                if (tagsVal.join(" ").toLowerCase().includes(q)) return true;
            } else if (tagsVal != null) {
                if (String(tagsVal).toLowerCase().includes(q)) return true;
            }

            return false;
        });
    }, [uniqueItems, query]);

    // Reset page if filtered changes such that current page is out-of-range or query changed
    useEffect(() => {
        setPage(0);
    }, [filtered.length, query]);

    const isSearching = query.trim().length > 0;
    const totalPages = isSearching ? 1 : Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const startIndex = isSearching ? 0 : page * ITEMS_PER_PAGE;
    const currentItems = isSearching
        ? filtered.slice() // show all matches while searching
        : filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Simple show/hide animation when changing pages:
    // hide -> swap page -> show
    const goToPage = (newPage: number) => {
        if (newPage < 0 || newPage >= totalPages || newPage === page) return;
        setIsHiding(true);
        // match Tailwind transition duration below (200ms)
        window.setTimeout(() => {
            setPage(newPage);
            setIsHiding(false);
        }, 200);
    };
    // Type guard for Promise
function isPromise<T = unknown>(v: unknown): v is Promise<T> {
  return v !== null && typeof v === "object" && typeof (v as { then?: unknown }).then === "function";
}
//Handle Refresh Click
  // refresh click: use isPromise guard to await if a Promise returned
  const handleRefreshClick = async () => {
    try {
      setRefreshing(true);
      const maybePromise = onRefresh();
      if (isPromise(maybePromise)) {
        await maybePromise;
      } else {
        // fallback minimum spinner time
        await new Promise<void>((r) => {
          refreshTimeoutRef.current = window.setTimeout(() => r(), 500);
        });
      }
    } catch (e) {
      // parent may surface error elsewhere; at least log
    
      console.error("Error during refresh:", e);
    } finally {
      setRefreshing(false);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    }
  };

    return (
        <div className={`w-full bg-white rounded shadow-sm h-screen flex flex-col ${className}`}>
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-slate-100 bg-white flex gap-2 items-center">
                <label htmlFor="memo-search" className="sr-only">
                    Search memos by title or tags
                </label>
                <div className="flex-1 relative">
                    <input
                        id="memo-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search title or tags..."
                        className="w-full px-3 py-2 border rounded-md text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-label="Search memos by title or tags"
                    />
                         <div className="flex items-center gap-2 absolute right-3 top-1/2 -translate-y-1/2">
                              
                               <button className="w-10 h-10 rounded-md flex items-center justify-center"
                               onClick={handleRefreshClick}
                               >
                                <ArrowClockwise24Regular className="text-[#5c7c95]"/>
                                {refreshing && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
              <svg className="animate-spin h-5 w-5 text-slate-700" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          )}
                              </button>
                              <button className="w-10 h-10 rounded-md flex items-center justify-center">
                                <ArrowSort24Regular className="text-[#5c7c95]"/>
                              </button>
                               <button className="w-10 h-10 rounded-md flex items-center justify-center">
                                <Filter24Regular className="text-[#5c7c95]"/>
                              </button>
                            
                            </div>
                </div>

                {query ? (
                    <button
                        onClick={() => setQuery("")}
                        className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                        aria-label="Clear search"
                        type="button"
                    >
                        Clear
                    </button>
                ) : null}

                <div className="text-sm text-slate-600">
                    {/* Showing {filtered.length}/{uniqueItems.length} */}
                    Showing {currentItems.length}/{uniqueItems.length}
                </div>
            </div>

            {/* table wrapper: makes the table horizontally scrollable on small screens */}
            <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-200 table-auto">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-slate-700">Subject</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-slate-700">Reference Number</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-slate-700">Owner</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-slate-700">Completed Date</th>
                        </tr>
                    </thead>

                    {/* animate rows via classes; hiding/showing handled when changing pages */}
                    <tbody
                        // key not strictly required, animation handled manually
                        className={`bg-white divide-y divide-slate-200 transition-all duration-200 ${
                            isHiding ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                        }`}
                    >
                        {currentItems.map((it: ContentItem, idx: number) => {
                            const isSelected = selectedId === it.id;
                            // use absolute index for stable fallback key
                            const absIdx = startIndex + idx;
                            return (
                                <tr
                                    key={it.id ?? `memo-${absIdx}`}
                                    className={`cursor-pointer transition-colors ${isSelected ? "bg-sky-100" : "hover:bg-slate-50"}`}
                                    tabIndex={0}
                                    role="button"
                                    aria-pressed={isSelected}
                                    onClick={() => onSelect?.(it)}
                                    onKeyDown={(e) => handleKey(e, it)}
                                >
                                    <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800">{truncateText(it.title, 50)}</span>
                                            {/* optional small tag list (if tags exist) */}
                                            {Array.isArray(it.tags) && it.tags.length > 0 ? (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {it.tags.join(", ")}
                                                </div>
                                            ) : it.tags ? (
                                                <div className="text-xs text-slate-500 mt-1">{String(it.tags)}</div>
                                            ) : null}
                                        </div>
                                    </td>

                                    <td className="px-4 sm:px-6 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                                        {it.referenceNumber ?? ""}
                                    </td>

                                    <td className="px-4 sm:px-6 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                                        {it.status ?? ""}
                                    </td>

                                    <td className="px-4 sm:px-6 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                                        {it.memoAuthor?.name ?? it.memoRecipient ?? ""}
                                    </td>

                                    <td className="px-4 sm:px-6 py-4 align-top text-sm text-slate-700 whitespace-nowrap">
                                        {formatDisplayDate(it.dateCompleted)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* footer row - contains rows count and pagination controls (same row) */}
            <div className="px-4 py-2 text-sm text-slate-600 border-t border-slate-100 flex items-center justify-between">
                <div>Rows: {filtered.length}</div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 0 || isSearching}
                        className="px-2 py-1 rounded text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-100"
                        aria-label="Previous page"
                        type="button"
                    >
                        ‹ Prev
                    </button>

                    <div className="flex items-center gap-1 text-slate-700">
                        <span className="text-xs text-slate-500">Page</span>
                        <span className="px-2 py-1 rounded bg-slate-50 text-sm font-medium">
                            {page + 1}
                        </span>
                        <span className="text-xs text-slate-500">of</span>
                        <span className="px-2 py-1 rounded bg-slate-50 text-sm font-medium">
                            {totalPages}
                        </span>
                    </div>

                    <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages - 1 || isSearching}
                        className="px-2 py-1 rounded text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-100"
                        aria-label="Next page"
                        type="button"
                    >
                        Next ›
                    </button>
                </div>
            </div>
        </div>
    );
}
