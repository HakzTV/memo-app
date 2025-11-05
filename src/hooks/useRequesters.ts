import { useMemo } from "react";
import sampleContent from "../data/sampleContent.json";
  //Custsom hook to get requesters data

  type Auth = { id?: string; name?: string; email?: string; avatarUrl?: string };
type MemoItem = { memoAuthor?: Auth };

function computeRequesters(): Auth[] {
    const map = (sampleContent as Record<string, { items?: MemoItem[] }>) || {};
    const byEmail = new Map<string, Auth>();
    Object.values(map).forEach((page) => {
        (page.items ?? []).forEach((it) => {
            const a = it?.memoAuthor;
            if (a?.email && !byEmail.has(a.email)) {
                byEmail.set(a.email, {
                    id: a.id,
                    name: a.name,
                    email: a.email,
                    avatarUrl: a.avatarUrl,
                });
            }
        });
    });
    return Array.from(byEmail.values());
}

/**
 * Pure function: compute requesters on demand (callable outside React components).
 */
export function getRequesters(): Auth[] {
    return computeRequesters();
}

/**
 * React hook: memoizes the computed requesters for the lifetime of a component.
 * Use inside React function components only.
 */
export function useRequesters(): Auth[] {
    return useMemo(() => computeRequesters(), []);
}
