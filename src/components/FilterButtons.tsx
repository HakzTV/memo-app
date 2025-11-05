// src/components/SearchControls.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePage } from "../hooks/usePage";
import {
  Search24Regular,
  ArrowClockwise24Regular,
  ArrowSort24Regular,
  Filter24Regular,
} from "@fluentui/react-icons";

import { formatDateToYMD } from "../lib/utlity";
import SingleRangeDatepicker from "./DatePicker";
import { useRequesters } from "../hooks/useRequesters";

type FilterPayload = {
  from?: string | null; // yyyy-mm-dd
  to?: string | null; // yyyy-mm-dd
  requesterEmail?: string | null;
};

type Props = {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  /**
   * onRefresh should ideally return a Promise so the spinner shows while it runs.
   * If it doesn't return a Promise, we show a short fallback spinner.
   */
  onRefresh: () => Promise<void> | void;
  onToggleSort: () => void;
  sortOrder: "asc" | "desc" | null;
  onApplyFilters?: (f: FilterPayload) => void;
  onClearFilters?: () => void;
  placeholder?: string;
};

/** type-guard for promises */

function isPromise<T = unknown>(v: unknown): v is Promise<T> {
  return v !== null && typeof v === "object" && typeof (v as { then?: unknown }).then === "function";
}
/**
 * Helper: format Date -> YYYY-MM-DD (local)
 */


/**
 * SearchControls
 * - uses Date objects for Datepicker
 * - suggestions dropdown with avatar, name, email
 * - no more 'any' usage for promises
 */
const SearchControls: React.FC<Props> = ({
  searchTerm,
  setSearchTerm,
  onRefresh,
  onToggleSort,
  sortOrder,
  onApplyFilters,
  onClearFilters,
  placeholder = "Search",
}) => {
  const { pageId } = usePage();

  // popover open state
  const [open, setOpen] = useState(false);

  // local filter state (Date objects)
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  // requester input & suggestions
  const [requesterValue, setRequesterValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // refresh spinner
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);

  // build author list with avatar, name, email from sampleContent
//   const requesters = useMemo(() => {
//     type Auth = { id?: string; name?: string; email?: string; avatarUrl?: string };
//     type MemoItem = { memoAuthor?: Auth };
    
//     const map = (sampleContent as Record<string, { items?: MemoItem[] }>) || {};
//     const byEmail = new Map<string, Auth>();
//     Object.values(map).forEach((page) => {
//       (page.items ?? []).forEach((it) => {
//         const a = it?.memoAuthor;
//         if (a?.email) {
//           if (!byEmail.has(a.email)) {
//             byEmail.set(a.email, {
//               id: a.id,
//               name: a.name,
//               email: a.email,
//               avatarUrl: a.avatarUrl,
//             });
//           }
//         }
//       });
//     });
//     return Array.from(byEmail.values());
//   }, []);

const requesters = useRequesters();
  // suggestions filtered by typed value (email or name)
  const suggestions = useMemo(() => {
    const q = (requesterValue ?? "").trim().toLowerCase();
    if (!q) return requesters.slice(0, 8);
    return requesters
      .filter((r) => {
        return (
          (r.email ?? "").toLowerCase().includes(q) ||
          (r.name ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [requesterValue, requesters]);

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

  const handleApply = () => {
    const payload: FilterPayload = {
      from: formatDateToYMD(from),
      to: formatDateToYMD(to),
      requesterEmail: requesterValue ? requesterValue : null,
    };
    
    onApplyFilters?.(payload);
    setOpen(false);
  };

  const handleClear = () => {
    setFrom(null);
    setTo(null);
    setRequesterValue("");
    onClearFilters?.();
  };

  // label shown for the requester input when a full match exists:
  const selectedRequesterLabel = useMemo(() => {
    if (!requesterValue) return "";
    const found = requesters.find((r) => r.email === requesterValue);
    if (found) return `${found.name ?? found.email} (${found.email})`;
    return requesterValue;
  }, [requesterValue, requesters]);

  // close suggestions/popover if clicking outside
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(ev.target as Node)) {
        setShowSuggestions(false);
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        type="search"
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-10 rounded-md bg-white focus:outline-none neutral-bg focus:ring-1 focus:ring-sky-300 text-slate-700"
        aria-label="Search memos"
      />

      {/* left search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Search24Regular className="text-[#5c7c95]" />
      </div>

      {/* right action buttons */}
      <div className="flex items-center gap-2 absolute right-3 top-1/2 -translate-y-1/2">
        {/* refresh */}
        <button
          className="relative w-10 h-10 rounded-md  flex items-center justify-center"
          onClick={handleRefreshClick}
          title="Clear search & refresh"
          aria-label="Refresh"
        >
          <ArrowClockwise24Regular className="text-[#5c7c95]" />
          {refreshing && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
              <svg className="animate-spin h-5 w-5 text-slate-700" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          )}
        </button>

        {/* sort */}
        <button
          className="w-10 h-10 rounded-md  flex items-center justify-center"
          onClick={onToggleSort}
          title={sortOrder === "asc" ? "Sort Z → A" : "Sort A → Z"}
        >
          <ArrowSort24Regular className="text-[#5c7c95]" />
        </button>

        {/* inbox filter */}
        {pageId === "inbox" && (
          <div className="relative">
            <button
              className="w-10 h-10 rounded-md border flex items-center justify-center"
              onClick={() => setOpen((s) => !s)}
              aria-expanded={open}
              aria-controls="inbox-filter-popover"
              title="Inbox filters"
            >
              <Filter24Regular className="text-[#5c7c95]" />
            </button>

            {open && (
              <div
                id="inbox-filter-popover"
                className="absolute right-0 mt-2 z-50 bg-white border rounded shadow-lg p-4"
                role="dialog"
                aria-modal="false"
                 style={{
      // ensure there is enough horizontal room for two calendars
      minWidth: 300,        // force wide minimum (px)
      maxWidth: 420,        // avoid growing forever
      overflow: "visible",  // allow datepicker popup to overflow if needed
    }}
              >
                {/* Datepickers: two single-date pickers for From / To */}
           <div className="grid grid-cols-2 gap-3 text-slate-600">

  <div className="col-span-2">
  <label className="text-xs text-slate-600">Date Range</label>
   <SingleRangeDatepicker
  value={{ startDate: from, endDate: to }}
  onChange={(r) => {
    setFrom(r.startDate);
    setTo(r.endDate);
  }}
  onApply={({ startDate, endDate }) => {
    const payload = {
      from: startDate?.toISOString().split("T")[0] ?? null,
      to: endDate?.toISOString().split("T")[0] ?? null,
      requesterEmail: requesterValue || null,
    };
    onApplyFilters?.(payload);
  }}
  onClear={handleClear}
  onClose={() => setOpen(false)}
/>

  </div>
</div>


                {/* requester searchable dropdown with avatars */}
                <div className="mt-3">
                  <label className="text-xs text-slate-600">Requester (search by name or email)</label>
                  <div className="relative mt-1">
                    <input
                      value={selectedRequesterLabel || requesterValue}
                      onChange={(e) => {
                        // allow typing free text; clear selected label if user types something different
                        setRequesterValue(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Type name or email"
                      className="w-full px-3 py-2 border rounded bg-white text-slate-700"
                      aria-label="Requester search"
                    />

                    {/* suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow max-h-60 overflow-auto z-50">
                        {suggestions.map((s) => (
                          <button
                            key={s.email}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-3"
                            onClick={() => {
                              setRequesterValue(s.email ?? "");
                              setShowSuggestions(false);
                            }}
                          >
                            <img
                              src={s.avatarUrl ?? `https://i.pravatar.cc/40?u=${encodeURIComponent(s.email ?? "")}`}
                              alt={s.name ?? s.email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="text-left">
                              <div className="text-sm font-medium text-slate-800">{s.name ?? s.email}</div>
                              <div className="text-xs text-slate-500">{s.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* if no suggestions */}
                    {showSuggestions && suggestions.length === 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow p-3 text-sm text-slate-500">
                        No requesters found
                      </div>
                    )}
                  </div>
                </div>

                {/* actions */}
                <div className="flex justify-between gap-2 mt-4">
                  <button
                    type="button"
                    className="px-3 py-2 rounded border text-sm bg-sky-700/50"
                    onClick={() => {
                      handleClear();
                      setOpen(false);
                    }}
                  >
                    Clear
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded border text-sm bg-sky-700/75"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-sky-700 text-white text-sm"
                      onClick={handleApply}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchControls;
