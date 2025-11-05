import type { Models } from "appwrite";
import { createContext } from "react";


export interface AppwriteContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    setUser: React.Dispatch<React.SetStateAction<Models.User<Models.Preferences> | null>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    refreshUser: () => Promise<void>;
}

export const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined);