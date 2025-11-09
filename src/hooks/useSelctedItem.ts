import { useContext } from "react";
import { SelectedItemContext } from "../context/selected-item-context";


export const useSelectedItem = () => {
  return useContext(SelectedItemContext);
};
