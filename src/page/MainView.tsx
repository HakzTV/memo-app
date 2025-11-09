// src/components/MainView.tsx
import React, { useCallback, useEffect, useState } from "react";
import { usePage } from "../hooks/usePage";

import { defaultFetcher } from "../lib/ContentService";
import type { ContentItem, FetchResponse } from "../props/MainContentProps";
import MemoTable from "../components/Dashboard";
import ContentSection from "../components/ContentSection";
import { sidebarItems } from "../props/SidebarProps";
import ComponentSwitcher from "../components/ComponentSwitcher";
import MemoViewWrapper from "../components/MemoViewWrapper";

const MainView: React.FC = () => {
    const { pageId } = usePage();


    const fetchAllForDashboard = useCallback(async () => {
         setLoading(true);
    setError(null);

    try {
      const pages = sidebarItems.map((s) => s.pageId).filter((p) => p !== "dashboard");
      const results = await Promise.all(pages.map((p) => defaultFetcher(p)));

      const mergedItems: ContentItem[] = results.flatMap((r) =>
        Array.isArray(r.items) ? (r.items as ContentItem[]) : []
      );
      const total = mergedItems.length;

      setData({ items: mergedItems, total });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
    },[]);
    // dashboard fetch state
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FetchResponse>({ items: [], total: 0 });

    //use effect
    useEffect(() => {
        let cancelled = false;

        const fetchAllForDashboard = async () => {
            setLoading(true);
            setError(null);

            try {
                const pages = sidebarItems.map((s) => s.pageId).filter((p) => p !== "dashboard");
                const results = await Promise.all(pages.map((p) => defaultFetcher(p)));

                if (cancelled) return;

                const mergedItems: ContentItem[] = results.flatMap((r) => (Array.isArray(r.items) ? (r.items as ContentItem[]) : []));
                const total = mergedItems.length;

                setData({ items: mergedItems, total });
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Failed to load dashboard data");
                setLoading(false);
            }
        };

        if (pageId === "dashboard") {
            fetchAllForDashboard();
        } else {
            // clear dashboard data when not on dashboard
            setData({ items: [], total: 0 });
            setLoading(false);
            setError(null);
        }

        return () => {
            cancelled = true;
        };
    }, [pageId]);

    // When on dashboard: always render the table, show a loading overlay while fetching
    if (pageId === "dashboard") {
        return (
            <div className="flex-1 relative">
                <MemoTable
                    items={(data.items as ContentItem[]) ?? []}
                    selectedId={null}
                    onRefresh={fetchAllForDashboard}
                    onSelect={(item) => {
                        console.log("Selected record (dashboard table):", item);
                    }}
                />

                {/* Loading overlay */}
                {loading && (
                    <div
                        role="status"
                        className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                            <span className="text-sm text-gray-700">Loading dashboard...</span>
                        </div>
                    </div>
                )}

                {/* Error banner */}
                {error && !loading && (
                    <div className="absolute top-2 left-2 right-2 text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    //Now i have an issue 
    if(pageId === "new"){
        return(
            <div className="flex gap-[5px] flex-1 w-full text-slate-700">
                <ContentSection pageId={pageId} />
                <ComponentSwitcher />
            </div>
        );
    }
 if(pageId === "drafts"){
        return(
            <div className="flex gap-[5px] flex-1 w-full text-slate-700">
                <ContentSection pageId={pageId} />
                <MemoViewWrapper />
            </div>
        );
    }

    // Default: render ContentSection for other pages (use current pageId)
    return <ContentSection pageId={pageId} />;
};

export default MainView;
