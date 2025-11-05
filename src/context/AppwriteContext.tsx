import React, { useState, useEffect, useCallback } from "react";
import { account, databases } from "../lib/appwrite";
import type { Models } from "appwrite";
import { AppwriteContext } from "./appwrite-context";

// ⚙️ Define your AppUser shape
export type AppUserRole = "admin" | "manager" | "employee";

export interface AppUser {
  name: string;
  email: string;
  phone?: string;
  role: AppUserRole;
  verified: boolean;
  userId: string;
  createdAt: string;
}

// ⚙️ Environment variables (replace with your own IDs)
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

export const AppwriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accountUser, setAccountUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = useCallback(async (userId: string) => {
    try {
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
      const data = userDoc as unknown as AppUser;

      // Ensure role defaults to employee
      if (!data.role) data.role = "employee";

      setAppUser(data);
    } catch (err) {
      console.error("⚠️ Failed to load AppUser document:", err);
      setAppUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const current = await account.get();
      setAccountUser(current);
      await fetchAppUser(current.$id);
    } catch {
      setAccountUser(null);
      setAppUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchAppUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = {
    user: accountUser,
    setUser: setAccountUser,
    loading,
    setLoading,
    refreshUser,
    // ✅ RBAC helpers
    isAdmin: appUser?.role === "admin",
    isManager: appUser?.role === "manager",
    isEmployee: appUser?.role === "employee",
  };

  return <AppwriteContext.Provider value={value}>{children}</AppwriteContext.Provider>;
};
