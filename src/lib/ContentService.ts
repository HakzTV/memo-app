import { Account, Query } from "appwrite";
import client, { databases } from "../lib/appwrite";
import type { FetchResponse, ContentItem } from "../props/MainContentProps";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const MEMO_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MEMOS_COLLECTION_ID;

export const defaultFetcher = async (pageId: string): Promise<FetchResponse> => {
  console.log("Fetching memos for pageId:", pageId);

  try {
    const account = new Account(client);
    const currentUser = await account.get(); // ✅ logged-in user

    // ✅ Fetch memos where `owner` matches current user
    const result = await databases.listDocuments(
      DATABASE_ID,
      MEMO_COLLECTION_ID,
      [Query.equal("owner", currentUser.$id)]
    );

    console.log("Fetched memos:", result);

    // ✅ Map Appwrite data into ContentItem format
    const mappedItems: ContentItem[] = result.documents.map((doc) => ({
      id: doc.$id,
      subject: doc.subject ?? "",
      referenceNumber: doc.referenceNumber ?? "",
      status: doc.status ?? "",
      owner: doc.owner,
      stylusComments: doc.stylusComments ?? "",
      attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
      reviewStatus: doc.reviewStatus ?? "",
      reviewsSection: doc.reviewsSection ?? [],
      divisionInCharge: doc.divisionInCharge ?? "",
      createdAt: doc.$createdAt, // Appwrite auto timestamp
    }));

    return {
      items: mappedItems,
      total: mappedItems.length,
    };
  } catch (error) {
    console.error("❌ Error fetching memos from Appwrite:", error);
    return { items: [], total: 0 };
  }
};
