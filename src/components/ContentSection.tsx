import React, { useEffect, useMemo, useState } from "react";
import type { MainContentProps, FetchResponse, ContentItem } from "../props/MainContentProps";

import {
  ChevronRight24Regular,
  DocumentSquare16Regular,
  Chat16Regular
} from "@fluentui/react-icons";
import { defaultFetcher } from "../lib/ContentService";
import { usePage } from "../hooks/usePage";

import type { Pill } from "../props/PillProps";
import { DEFAULT_PILLS } from "../props/PillProps";
import { filterItems } from "../lib/filterHelpers";
import { getPillsForPage } from "../lib/pillHelper";
import { formatDisplayDate, truncateText } from "../lib/utlity";
import SearchControls from "./FilterButtons";
import { fetchUserById } from "../lib/userService";
import { Account, Query } from "appwrite";
import client, { databases } from "../lib/appwrite";
import { useSelectedItem } from "../hooks/useSelctedItem";

type Props = MainContentProps & {
  pills?: Pill[]; // pills passed in (abstract)
  initialPillId?: string; // optional initial pill id
};

const ContentSection: React.FC<Props> = ({ fetcher = defaultFetcher, pills = DEFAULT_PILLS, initialPillId }) => {
  const { pageId } = usePage();

  // raw data
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<FetchResponse>({ items: [], total: 0 });
  const [error, setError] = useState<string | null>(null);
const [userProfiles, setUserProfiles] = useState<Record<string, { name: string; avatarUrl: string | null }>>({});


//profile picture 
useEffect(() => {
  if (!data.items || data.items.length === 0) return;

  const actionOfficerIds = new Set<string>();

  // Collect all unique actionOfficer IDs from review sections
  for (const memo of data.items) {
    memo.reviewsSection?.forEach((rev) => {
      if (rev.actionOfficer) actionOfficerIds.add(rev.actionOfficer);
    });
  }

  // Fetch missing profiles
  (async () => {
    const newProfiles: Record<string, { name: string; avatarUrl: string | null }> = { ...userProfiles };

    for (const id of actionOfficerIds) {
      if (!newProfiles[id]) {
        const user = await fetchUserById(id);
        if (user) {
          // Build Appwrite image URL if fileId exists
          const avatarUrl = user.profilePictureFileId
            ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${
                import.meta.env.VITE_APPWRITE_USER_AVATAR_BUCKET
              }/files/${user.profilePictureFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
            : null;

          newProfiles[id] = {
            name: user.name,
            avatarUrl
          };
        }
      }
    }
    setUserProfiles(newProfiles);
  })();
}, [data]);

  // search term with debounce 
  const [searchTerm, setSearchTerm] = useState<string>(""); 
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(searchTerm);
  //Sorting state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  //db query
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const MEMO_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MEMOS_COLLECTION_ID;
  //
  // ---------- derive pillsForPage from pageId using helper ----------
  const pillsForPage: Pill[] = useMemo(() => {
    const source = Array.isArray(pills) && pills.length > 0 ? pills : DEFAULT_PILLS;
    const propMatches = source.filter((p) => Array.isArray(p.appliesTo) && p.appliesTo!.includes(pageId));
    if (propMatches.length > 0) return propMatches;
    return getPillsForPage(pageId);
  }, [pageId, pills]);
// filter object applied from SearchControls
const [inboxFilters, setInboxFilters] = useState<{ from?: string | null; to?: string | null; requesterEmail?: string | null }>({});

  // active pill id
  const [activePillId, setActivePillId] = useState<string>(() => {
    if (initialPillId) return initialPillId;
    const byPage = pillsForPage.find((p) => p.appliesTo?.includes(pageId));
    return byPage?.id ?? pillsForPage[0]?.id ?? "unassigned";
  });

  // computed filtered view (after pill filter AND search)
  const [filtered, setFiltered] = useState<FetchResponse>({ items: [], total: 0 });
  const {selectedId, setSelectedId} = useSelectedItem();

  // Fetch raw data when pageId changes
// Fetch memos owned by the logged-in user
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);

  (async () => {
    try {
      const account = new Account(client);
      const currentUser = await account.get();

      // ✅ Fetch memos where owner = currentUser.$id
      const result = await databases.listDocuments(
        DATABASE_ID,
        MEMO_COLLECTION_ID,
        [Query.equal("owner", currentUser.$id)]
      );

      if (!cancelled) {
        // Map Appwrite docs into your ContentItem structure
        const mapped: ContentItem[] = result.documents.map((doc) => ({
          id: doc.$id,
          subject: doc.subject,
          description: doc.description,
          referenceNumber: doc.referenceNumber,
          status: doc.status,
          owner: doc.owner,
          stylusComments: doc.stylusComments,
          attachments: doc.attachments || [],
          reviewStatus: doc.reviewStatus,
          reviewsSection: doc.reviewsSection,
          divisionInCharge: doc.divisionInCharge,
          createdAt: doc.$createdAt, // use built-in timestamp
        }));

        setData({ items: mapped, total: mapped.length });
        setLoading(false);
      }
    } catch (err) {
      if (!cancelled) {
        console.error("❌ Error fetching memos:", err);
        setError(err instanceof Error ? err.message : "Failed to load memos");
        setLoading(false);
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [pageId]);

  // When pageId or pillsForPage changes, pick a pill that applies to it (if any)
  useEffect(() => {
    const candidate = pillsForPage.find((p) => p.appliesTo?.includes(pageId));
    if (candidate) {
      setActivePillId(candidate.id);
    } else {
      setActivePillId((cur) => cur ?? pillsForPage[0]?.id ?? "unassigned");
    }
    // reset search when page/pills change to avoid surprising filters
    setSearchTerm("");
  }, [pageId, pillsForPage]);

  // Apply pill filtering (base) and then search (overlay)
  useEffect(() => {
    const items: ContentItem[] = Array.isArray(data.items) ? (data.items as ContentItem[]) : [];
    // first apply pill-based filter
    const pillMatched = filterItems(items, activePillId, pillsForPage);

    // then apply search over the pillMatched array
    const q = (debouncedSearchTerm ?? "").trim().toLowerCase();
    let searched = q.length === 0 ? pillMatched : pillMatched.filter((it) => {
      // fields to search: subject, description, memoAuthor.name, memoRecipient, referenceNumber
      const subject = (it.subject ?? "").toString().toLowerCase();
      const desc = (it.description ?? "").toString().toLowerCase();
      const author = (it.owner ?? "").toString().toLowerCase();
      const recipient = (it.assignedTo ?? "").toString().toLowerCase();
      const ref = (it.referenceNumber ?? "").toString().toLowerCase();

      return (
        subject.includes(q) ||
        desc.includes(q) ||
        author.includes(q) ||
        recipient.includes(q) ||
        ref.includes(q)
      );
    });
   // apply inbox filters (date range + requester email) if any
  if (inboxFilters && (inboxFilters.from || inboxFilters.to || inboxFilters.requesterEmail)) {
    const fromTime = inboxFilters.from ? new Date(`${inboxFilters.from}T00:00:00`).getTime() : null;
    const toTime = inboxFilters.to ? new Date(`${inboxFilters.to}T23:59:59`).getTime() : null;
    const req = (inboxFilters.requesterEmail ?? "").trim().toLowerCase();

    searched = searched.filter((it) => {
      const dt = it.createdAt ? new Date(it.createdAt).getTime() : null;
      if (fromTime !== null && (dt === null || dt < fromTime)) return false;
      if (toTime !== null && (dt === null || dt > toTime)) return false;
      if (req && !(it.owner ?? "").toLowerCase().includes(req)) return false;
      return true;
    });
  }

  // apply sorting if requested
  if (sortOrder) {
    searched = [...searched].sort((a, b) => {
      const ta = (a.subject ?? "").toString().toLowerCase();
      const tb = (b.subject ?? "").toString().toLowerCase();
      if (ta < tb) return sortOrder === "asc" ? -1 : 1;
      if (ta > tb) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }
  
    setFiltered({ items: searched, total: searched.length });
    console.log("Filtered items:", searched);
    // clear selection if it's no longer visible
    if (selectedId && !searched.some((it) => it.id === selectedId)) {
      setSelectedId(null);
    }
 
  }, [data, activePillId, pillsForPage, debouncedSearchTerm, selectedId, inboxFilters, sortOrder]);

  const activePill = pillsForPage.find((p) => p.id === activePillId) ?? pillsForPage[0];

  // Debounce search term delayed by 300ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(id);
  },[searchTerm]);
  // Use effect end
  // pill click handlers
  const onClickPill = (p: Pill) => {
    setActivePillId(p.id);
    // reset search for clarity when switching pill
    setSearchTerm("");
  };

  const handleSelectItem = (item: ContentItem) => {
    setSelectedId(item.id ?? null);
    // structured log for testing/demo purposes
      console.log("Selected memo record:", JSON.parse(JSON.stringify(item)));
  };

  const handleRefresh = () => {
    setLoading(true);
    fetcher(pageId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load content");
        setLoading(false);
      });
  };

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }
  // hide content when Dashboard is selected
  // if (pageId === "dashboard") return null;

  return (
    <div className="flex-1 flex flex-col p-4 max-w-[500px] bg-white"
      style={{
        minWidth: "500px",
      }}
    >
      {/* top controls */}
     <SearchControls
      searchTerm={debouncedSearchTerm}
      setSearchTerm={setDebouncedSearchTerm}
      placeholder="Search"
      onRefresh={handleRefresh}
      onToggleSort={handleToggleSort}
      sortOrder={sortOrder}
      onApplyFilters={(f)=>setInboxFilters(f)}
      onClearFilters={()=> setInboxFilters({})}

     />

      {/* Pills */}
      <div className="mb-3 soft-shadow flex justify-end p-[6px]">
        <div className="flex gap-3">
          {pillsForPage.map((p) => {
            const active = p.id === activePillId;
            return (
              <button
                key={p.id}
                onClick={() => onClickPill(p)}
                className={`px-3 py-2 rounded-md text-sm w-[150px] flex items-center justify-center gap-2 border cursor-pointer border-[#d1d1d1] ${
                  active ? "bg-sky-700 text-white" : "bg-white text-black "
                } ${p.className ?? ""}`}
                aria-pressed={active}
                title={p.label}
              >
                <span className="flex items-center h-[20px] w-[20px]">
                  {(() => {
                    const IconComp = p.icon ?? (p.id === "unassigned" ? DocumentSquare16Regular : Chat16Regular);
                    return <IconComp className="w-4 h-4" aria-hidden />;
                  })()}
                </span>

                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-sky-200 mb-3" />

      {/* content list */}
      <div className="flex-1 overflow-auto bg-2">
        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-56 bg-gray-200 rounded" />
          </div>
        )}

        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <>
            {filtered.total === 0 ? (
              <div className="text-gray-500 text-center">No memo at the moment</div>
            ) : (
              <ul className="mb-[8px]">
                {filtered.items.map((it) => {
                  const isSelected = selectedId === it.id;
                  return (
                    <li key={it.id} className="rounded overflow-hidden">
                      <button
                        onClick={() => handleSelectItem(it)}
                        className={`w-full text-left bg-white rounded shadow-sm border transition-colors cursor-pointer  ${
                          isSelected ? "ring-2 ring-sky-300 bg-slate-50" : "hover:bg-slate-50"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex">
                          <div
                            className={`w-1 ${isSelected ? "bg-sky-600" : "bg-transparent"}`}
                          />
                          <div className="flex-1 px-4 py-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex gap-3 items-center ">
                                {activePill.showAvatar !== false && (() => {
  // Find first review with an actionOfficer (you can customize logic)
  const firstReview = it.reviewsSection?.find(r => r.actionOfficer);
  const officerId = firstReview?.actionOfficer;
  const officerProfile = officerId ? userProfiles[officerId] : undefined;

  const avatarUrl = officerProfile?.avatarUrl;
  const displayName = officerProfile?.name ?? "Unknown Officer";
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // 👈 generic blank user avatar

  return (
    <img
      src={avatarUrl || defaultAvatar}
      alt={displayName}
      className="w-[50px] h-[50px] rounded-full object-cover border border-gray-300"
      title={displayName}
    />
  );
})()}

                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-800">{truncateText(it.subject, 40)}</h3>
                                    <div className="text-sky-700 text-sm">{formatDisplayDate(it.createdAt)}</div>
                                    <div className="mt-2 text-sm text-amber-400 capitalize">
                                      <span className="font-semibold">Status :</span>{" "}
                                      <span className="font-medium">{it.status === "final-draft" ? "Final Draft" : it.status}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-3 text-slate-400">
                                <span className="w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100" aria-label="Open memo">
                                  <ChevronRight24Regular className="w-4 h-4 text-slate-400" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContentSection;
