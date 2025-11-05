// ComponentSwitcher.tsx
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Save24Regular } from "@fluentui/react-icons";
import { DynamicForm, type DynamicFormRef } from "./DynamicUniversal";
import type { ContentItem } from "../props/MainContentProps";
 // ✅ Appwrite client
import { Account, ID } from "appwrite";
import client, { databases, storage } from "../lib/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const MEMO_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MEMOS_COLLECTION_ID;
const MEMO_BUCKET_ID = import.meta.env.VITE_APPWRITE_MEMOS_BUCKET_ID// fallback

// 🔹 Basic form schema
// 🔹 Form schema (owner REMOVED)
const contentItemSchema: Omit<ContentItem, "owner" > & {
  _selectOptions?: Record<string, string[]>;
}= {
  referenceNumber: "",
  _selectOptions: {
    status: ["draft", "reviewed"],
  },

  status: "",
  subject: "",
  description: "",
  attachments: [],

};




// 🔹 Layout guide (2 = full width, 1 = half width)
const contentItemLayout: Record<string, number> = {
referenceNumber: 1, // half width
status: 1,         // half width
  subject: 2,        // full width
  description: 2,    // full width
  attachments: 2,    // full width
};

const ComponentSwitcher = () => {
  const formRef = useRef<DynamicFormRef | null>(null);
  const [loading, setLoading] = useState(false);
 const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // ✅ Fetch logged-in Appwrite user once
  useEffect(() => {
    const account = new Account(client);
    const getCurrentUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser({
          id: user.$id,
          name: user.name,
          email: user.email,
        });
      } catch (err) {
        console.error("Unable to fetch current user:", err);
        toast.error("Please log in again");
      }
    };
    getCurrentUser();
  }, []);

  // 🧩 Submit handler
  const handleFormSubmit = async (data: ContentItem) => {
    if (!currentUser) {
      toast.error("No logged-in user found.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Upload attachments (if any)
      const attachmentFileIds: string[] = [];

      if (data.attachments && Array.isArray(data.attachments)) {
        for (const file of data.attachments) {
          if (file instanceof File) {
            const uploaded = await storage.createFile(MEMO_BUCKET_ID, ID.unique(), file);
            attachmentFileIds.push(uploaded.$id);
          } else if (typeof file === "string") {
            attachmentFileIds.push(file); // reuse fileId if already uploaded
          }
        }
      }

      // ✅ Build final memo object
      const newMemo = {
        subject: data.subject ?? "",
        referenceNumber: data.referenceNumber ?? "",
        status: data.status ?? "draft",
        owner: currentUser.id, // 👈 the logged-in user becomes the owner
        description: data.description ?? "",
        attachments: attachmentFileIds,
        reviewStatus: data.status ?? "Pending",
      };

      // ✅ Create the document in Appwrite
      const res = await databases.createDocument(
        DATABASE_ID,
        MEMO_COLLECTION_ID,
        ID.unique(),
        newMemo
      );
console.log(res.$createdAt);  // ISO timestamp
console.log(res.$updatedAt);

      console.log("✅ Memo created:", res);
      toast.success("Memo created successfully!");
      setLoading(false);
    } catch (error) {
      console.error("❌ Error creating memo:", error);
      toast.error("Failed to create memo");
      setLoading(false);
    }
  };

  // 🔹 Adapter for DynamicForm
  const handleSubmitAdapter = (data: Record<string, unknown>) => {
    handleFormSubmit(data as ContentItem);
  };

  // 🔹 Trigger form submit
  const handleSaveClick = () => {
    formRef.current?.submitForm();
  };

  return (
    <div className="w-full mx-auto flex flex-col gap-1.5 h-full">
      <div className="bg-white flex justify-end items-center py-2 px-6">
        <button
          disabled={loading}
          onClick={handleSaveClick}
          className={`${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700"
          } text-white px-6 py-2 rounded-md transition`}
        >
          <Save24Regular />
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* 🔹 The Dynamic Universal Form */}
      <DynamicForm
        ref={formRef}
        schema={contentItemSchema}
        layout={contentItemLayout}
        onSubmit={handleSubmitAdapter}
      />
    </div>
  );
};

export default ComponentSwitcher;
