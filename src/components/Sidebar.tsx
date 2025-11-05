// src/components/SideBar.tsx
import React, { useEffect, useRef, useState } from "react";

import { sidebarItems, type NavItem } from "../props/SidebarProps";
import { GridDots24Regular } from "@fluentui/react-icons";
import { usePage } from "../hooks/usePage";
import { getAllPageCounts } from "../lib/countHelper";

type Props = {
  initialOpen?: boolean;
  items?: NavItem[];
  onSelect?: (id: string) => void;
};

// extend NavItem locally to track whether the item originally had a count
type NavItemWithMeta = NavItem & { _hasCount?: boolean };

const SideBar: React.FC<Props> = ({ initialOpen = true, items, onSelect }) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

  // initialize navItems but capture whether each item originally had a `count` key
  const initialNav = (items ?? sidebarItems).map((i) => ({
    ...i,
    // _hasCount true if 'count' property exists on the original item
    _hasCount: Object.prototype.hasOwnProperty.call(i, "count"),
  })) as NavItemWithMeta[];

  const [navItems, setNavItems] = useState<NavItemWithMeta[]>(initialNav);

  const { pageId: ctxPageId, setPageId } = usePage();
  const toggle = () => setIsOpen((s) => !s);
  const prevCountsRef = useRef<Record<string, number> | null>(null);

  // Sync active state with context pageId (keeps _hasCount intact)
  useEffect(() => {
    setNavItems((prev) =>
      prev.map((i) => ({ ...i, active: i.pageId === ctxPageId }))
    );
  }, [ctxPageId]);

  const handleSelect = (id: string) => {
    setNavItems((prev) => prev.map((i) => ({ ...i, active: i.pageId === id })));
    setPageId(id);
    onSelect?.(id);
  };

  // new effect: initial load + periodic refresh every 60s
useEffect(() => {
  let mounted = true;

  const refreshCounts = async () => {
    try {
      const counts = await getAllPageCounts(); // ✅ Wait for async result
      const prev = prevCountsRef.current;
      let changed = false;

      if (!prev) {
        changed = true;
      } else {
        const keys = new Set([...Object.keys(prev), ...Object.keys(counts)]);
        for (const k of keys) {
          if ((prev[k] ?? 0) !== (counts[k] ?? 0)) {
            changed = true;
            break;
          }
        }
      }

      if (changed && mounted) {
        prevCountsRef.current = counts;

        setNavItems((prevNav) =>
          prevNav.map((i) => {
            const newCount = i._hasCount ? (counts[i.pageId] ?? 0) : undefined;
            return {
              ...i,
              active: i.pageId === ctxPageId,
              count: newCount,
            } as NavItemWithMeta;
          })
        );
      }
    } catch (e) {
      console.error("Failed to refresh counts", e);
    }
  };

  // ✅ Initial load must await this
  (async () => {
    await refreshCounts();
  })();

  // ✅ Poll every 60s (still async-safe)
  const id = setInterval(() => {
    refreshCounts();
  }, 10000);

  return () => {
    mounted = false;
    clearInterval(id);
  };
}, [ctxPageId]);


  return (
    <aside
      className="flex flex-col h-screen bg-white border-r transition-all duration-200 ease-in-out overflow-hidden  rounded-sm"
      style={{
        width: isOpen ? "200px" : "50px",
        minWidth: isOpen ? "200px" : "50px",
      }}
      aria-label="Application navigation"
    >
      {/*  waffle icon */}
      <div className="justify-center h-[72px] border-b py-3 px-2">
        <button
          aria-pressed={isOpen}
          aria-label={isOpen ? "Collapse navigation" : "Open navigation"}
          onClick={toggle}
          className="w-9 h-9 grid place-items-center rounded-md border-none border-sky-100  hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
        >
          <GridDots24Regular className="text-slate-700" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pl-[4px] pr-[4px]">
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = item.active;
            const Icon = item.icon;
            return (
              <div>

              <button
                key={item.pageId}
                onClick={() => handleSelect(item.pageId)}
                className={`w-full flex items-center ${
                  isOpen ? "justify-start gap-3 px-2" : "justify-center"
                } py-2  transition-all duration-150 cursor-pointer ${
                  isActive ? "bg-orange-50 border-l-4 border-orange-400" : "hover:bg-slate-50"
                }`}
                title={!isOpen ? item.label : undefined}
              >
                {/* Icon only visible centered when collapsed */}
                <span className={`flex items-center justify-center  w-6 h-6 ${isActive ? "text-orange-400" : "text-slate-700"}`}>
                  <Icon />
                </span>

                {/* Label hidden when collapsed */}
                {isOpen && (
                  <span className={`flex-1 text-left text-sm  truncate ${isActive ? "text-orange-400" : "text-slate-900"}`}>
                    {item.label}
                  </span>
                )}

                {/* Count hidden when collapsed; only appears if item.count is a number */}
                {isOpen && typeof item.count === "number" && (
                  <span className="text-sm text-slate-500">{item.count}</span>
                )}
              </button>
              <div className="bl-border"></div>
              </div>

            );
          })}
        </div>
      </nav>

      {/* Bottom spacer */}
      <div style={{ minHeight: 16 }} />
    </aside>
  );
};

export default SideBar;
