import { useContext } from "react";
import { PageContext, type PageContextType } from "../context/page-context";

// Hook to use the PageContext
export const usePage = (): PageContextType => {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error("usePage must be used inside PageProvider");
  return ctx;
};
