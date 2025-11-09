import { createContext } from "react";

type SelectedItemContextType = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
};

export const SelectedItemContext = createContext<SelectedItemContextType>({
  selectedId: null,
  setSelectedId: () => {},
});
