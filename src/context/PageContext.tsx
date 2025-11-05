import { useState } from "react";
import { PageContext } from "./page-context";

/**
 * Provide a default pageId (use "drafts" or whichever matches your sidebar default)
 * We'll expose a hook usePage() for easy consumption.
 */
export const PageProvider: React.FC<{ children: React.ReactNode; initial?: string }> = ({
  children,
  initial = "drafts",
}) => {
  const [pageId, setPageId] = useState<string>(initial);
  return <PageContext.Provider value={{ pageId, setPageId }}>{children}</PageContext.Provider>;
};

