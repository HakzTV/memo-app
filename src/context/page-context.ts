import { createContext } from "react";

export type PageContextType = {
  pageId: string;
  setPageId: (id: string) => void;
};

export const PageContext = createContext<PageContextType | undefined>(undefined);