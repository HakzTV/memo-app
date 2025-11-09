import DynamicUniversalView from "./DynamicUniversalView";
import { useSelectedItem } from "../hooks/useSelctedItem";

const MemoViewWrapper = () => {
  const { selectedId, setSelectedId } = useSelectedItem();

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;
  const MEMO_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MEMOS_COLLECTION_ID;

  // If no memo is selected → show list
  if (!selectedId) {
    return false
  }

  // If one is selected → show view page
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-3 bg-white border-b flex justify-between items-center">
        <button
          onClick={() => setSelectedId(null)}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
        >
          ← Back
        </button>
        <p className="font-semibold text-gray-700">Memo Details</p>
        <div />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <DynamicUniversalView
          databaseId={DATABASE_ID}
          collectionId={MEMO_COLLECTION_ID}
          documentId={selectedId}
        />
      </div>
    </div>
  );
};

export default MemoViewWrapper;
