import React, {  useState } from "react";
import { SelectedItemContext } from "./selected-item-context";


export const SelectedItemProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <SelectedItemContext.Provider value={{ selectedId, setSelectedId }}>
      {children}
    </SelectedItemContext.Provider>
  );
};
