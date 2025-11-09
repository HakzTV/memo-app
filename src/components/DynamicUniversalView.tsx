import React, { useEffect, useState } from "react";
import { databases } from "../lib/appwrite";
import type { ContentItem } from "../props/MainContentProps";
import { formatDisplayDate } from "../lib/utlity";

interface DynamicUniversalViewProps {
  databaseId: string;
  collectionId: string;
  documentId: string;
}

const DynamicUniversalView: React.FC<DynamicUniversalViewProps> = ({
  databaseId,
  collectionId,
  documentId,
}) => {
  const [data, setData] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await databases.getDocument(databaseId, collectionId, documentId);

      const mapped: ContentItem = {
        id: res.$id,
        referenceNumber: res.referenceNumber ?? "",
        subject: res.subject ?? "",
        description: res.stylusComments ?? "", // ✅ Correct field from your form
        status: res.status ?? "",
        owner: res.owner ?? "", // still user ID; we can resolve name later
        assignedTo: res.assignedTo ?? "",
        createdAt: res.$createdAt ?? "", // ✅ Appwrite auto timestamp
        attachments: res.attachments ?? [],
        reviewsSection: Array.isArray(res.reviewsSection) ? res.reviewsSection : []
      };

      setData(mapped);
    } catch (err: unknown) {
      console.error("❌ Failed to fetch document:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [databaseId, collectionId, documentId]);


  if (loading)
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Loading document...
      </div>
    );

  if (error)
    return (
      <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-md">
        {error}
      </div>
    );

  if (!data)
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-md">
        No data found.
      </div>
    );

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex flex-wrap justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 font-semibold">
            REF No: {data.referenceNumber || "N/A"}
          </p>
          <h2 className="text-xl font-semibold text-gray-800 mt-1">
            {data.subject || "Untitled"}
          </h2>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100">
            Review
          </button>
          <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100">
            Edit
          </button>
          <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100">
            Send
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-b bg-white px-4 py-3 text-sm">
        <div>
          <p className="text-gray-500 font-medium">Initiated By</p>
          <p className="text-gray-800 font-semibold">
            {data.owner || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Assigned To</p>
          <p className="text-gray-800 font-semibold">
            {data.assignedTo || "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Date Created</p>
          <p className="text-gray-800 font-semibold">
            {data.createdAt ? formatDisplayDate(data.createdAt) : "N/A"}

          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium">Date Completed</p>
          <p className="text-gray-800 font-semibold">
            {data.date
              ? new Date(data.date).toLocaleString()
              : "Not completed"}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 text-sm leading-relaxed text-gray-800 space-y-3">
        {data.description ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        ) : (
          <p className="text-gray-500 italic">No description provided.</p>
        )}

        {/* Review section (if any) */}
        {data.reviewsSection && data.reviewsSection.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Reviews
            </h3>
            <div className="space-y-3">
              {data.reviewsSection.map((review, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-md p-3 bg-gray-50"
                >
                  <p className="font-medium text-gray-800">
                    Reviewer: {review.reviewer}
                  </p>
                  {review.actionOfficer && (
                    <p className="text-gray-700">
                      Officer: {review.actionOfficer}
                    </p>
                  )}
                  {review.comments && (
                    <p className="text-gray-700 mt-2 italic">
                      “{review.comments}”
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Date: {new Date(review.date).toLocaleDateString()}
                  </p>
                  {review.status && (
                    <span className="inline-block mt-2 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {review.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicUniversalView;
