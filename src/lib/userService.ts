import { databases } from "./appwrite";

// lib/userService.ts
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

export async function fetchUserById(userId: string) {
  try {
    const res = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
    return {
      id: res.$id,
      name: res.name ?? "Unknown User",
      profilePictureFileId: res.profilePictureFileId ?? null
    };
  } catch (error) {
    console.warn("Could not fetch user:", error);
    return null;
  }
}
const MEMO_COLLECTION_DATA = import.meta.env.VITE_APPWRITE_MEMOS_COLLECTION_ID;

export async function fetchDocument(documentId: string) {
  try {
    const res = await databases.getDocument(DATABASE_ID, MEMO_COLLECTION_DATA, documentId);
    return res; // this is your document data object
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
}