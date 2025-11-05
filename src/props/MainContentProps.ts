// export type ContentItem = {
//   id?: string;
//   subject: string;
//   description?: string;
//   tags?: string[];
//   referenceNumber?: string;
//   memoAuthor?: {
//     id?: string;
//     name: string;
//     email?: string;
//     avatarUrl?: string;
//   };
//   memoRecipient?: string;
//   status?: string;
//   attachments?: { filename: string; url?: string; size?: number }[];
//   createdAt?: string;  // ISO
//   dateCompleted?: string; // ISO
//   reviewsSection?: { reviewer: string; actionOfficer?: string; comments?: string; date?: string }[];
// };
export type ReviewItem = {
  reviewer: string;            // userId reference (max 64)
  actionOfficer?: string;      // userId reference (max 64)
  comments?: string;           // up to 2000 chars
  date: string;                // ISO 8601 date string
  signature?: string;          // fileId (max 64)
  status?: string;             // e.g., "Approved", "Pending" (max 50)
};

export type ContentItem = {
  id?: string;                 // document ID (Appwrite $id)
  subject: string;             // required (max 255)
  assignedTo?: string;         // userId reference (max 64)
  description?: string;       // up to 5000 chars

  owner: string;               // userId reference (max 64)
  date?: string;               // ISO 8601 (optional)
  status?: string;             // e.g. "In Progress", "Completed" (max 50)
  referenceNumber?: string;    // (max 50)
  reviewStatus?: string;       // "Pending" | "Reviewed" (max 50)
  divisionInCharge?: string;   // Department name (max 150)
  contentType?: string;        // "Memo", "Request", etc. (max 50)
  priority?: string;           // "Low" | "Medium" | "High" (max 20)
  stylusComments?: string;     // up to 10,000 chars
   attachments?: (File | string)[];      // array of fileIds (each max 64)
  signature?: string;          // main signature fileId (max 64)
  reviewsSection?: ReviewItem[]; // array of nested review objects
  createdAt?: string;          // auto timestamp from Appwrite (ISO)
};


export type FetchResponse = {
  items: ContentItem[];
  total: number;
};

export type MainContentProps = {
  pageId: string;
  fetcher?: (pageId: string) => Promise<FetchResponse>;
};

