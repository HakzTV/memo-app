// hooks/useAppwrite.ts
import { useContext } from "react";
import { AppwriteContext } from "../context/appwrite-context";
import { account, databases } from "../lib/appwrite";
import { AuthenticationFactor, AuthenticatorType, ID } from "appwrite";
import type { AppUser } from "../props/User";



export const  useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) throw new Error("useAppwrite must be used within an AppwriteProvider");

  const { user, refreshUser, ...rest } = context;

  // ✅ Register new user in Appwrite Auth + Database
  const signup = async (email: string, password: string, name: string, phone?: string, role?: string) => {
    // Create user account in Appwrite Auth
    const newUser = await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);

    // Send verification email
    await account.createVerification(`${window.location.origin}/verify-email`);

    // ✅ Add user info into the "users" collection
    const userData: AppUser = {
      name,
      email,
      phone: phone || "",
      role: (role as AppUser["role"]) || "Employee", 
      verified: false,
      userId: newUser.$id,
    };
console.log("DB:", import.meta.env.VITE_APPWRITE_DB_ID);
console.log("COLLECTION:", import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID);

    await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DB_ID!,
      import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!,
      ID.unique(),
      userData
    );

    await refreshUser();
  };

  // Other auth helpers
const login = async (email: string, password: string): Promise<{ requiresMFA?: boolean; challengeId?: string }> => {
  try {
    await account.createEmailPasswordSession(email, password);
    await refreshUser();
    return {};
  } catch (err: unknown) {
    console.error("🧩 Raw Appwrite Error object:", JSON.stringify(err, null, 2));

    // Safely check if MFA required
    const error = err as { type?: string };
    if (error.type === "user_more_factors_required") {
      console.log("⚙️ MFA required — starting challenge...");

      // 1️⃣ Start the MFA challenge manually
   const challenge = await account.createMFAChallenge({
  factor: AuthenticationFactor.Totp, // ✅ enum, not string
});

      console.log("✅ Got challenge ID:", challenge.$id);
      return { requiresMFA: true, challengeId: challenge.$id };
    }

    throw err;
  }
};

const logout = async () => {
  try {
    await account.deleteSession("current");
  } catch (err) {
    console.error("Failed to delete session:", err);
  }
  await refreshUser(); // clears context
  window.location.href = "/login"; // full reload + redirect
};


  const sendEmailVerification = async () => {
    await account.createVerification(`${window.location.origin}/verify-email`);
  };

  const verifyEmail = async (userId: string, secret: string) => {
    await account.updateVerification(userId, secret);
  };
  // ✅ MFA (TOTP) setup helpers
 // In hooks/useAppwrite.ts

// ------------------- MFA helpers (fixed) -------------------

// Create a new TOTP authenticator (returns secret/uri/qr)
const setupMFA = async () => {
  // use the SDK enum (AuthenticatorType) — pass the enum value
  const mfa = await account.createMFAAuthenticator(AuthenticatorType.Totp);
  // mfa typically contains { secret, uri, qr } depending on SDK version
  return mfa;
};

// Verify the user-provided OTP against the created authenticator
const verifyMFA = async (otp: string) => {
  // updateMFAAuthenticator expects { type, otp } where type is the enum
  await account.updateMFAAuthenticator({ type: AuthenticatorType.Totp, otp });
};

// Enable MFA for the current user account (turn MFA on)
const enableMFA = async () => {
  // correct method name is updateMFA and it expects { mfa: boolean }
  await account.updateMFA({ mfa: true });
};

// Disable MFA for the current user account (turn MFA off)
const disableMFA = async () => {
  await account.updateMFA({ mfa: false });
};
const verifyMFAChallenge = async (challengeId: string, otp: string) => {
  if (!challengeId || challengeId.trim().length < 1) {
    throw new Error("Invalid MFA challengeId — cannot verify without it.");
  }

  await account.updateMFAChallenge({ challengeId, otp });
  await refreshUser();
};

// ----------------- end MFA helpers -----------------



  return {
    ...rest,
    user,
    signup,
    login,
    verifyMFAChallenge,
    logout,
    refreshUser,
    sendEmailVerification,
    verifyEmail,
      setupMFA,
    verifyMFA,
    enableMFA,
    disableMFA,
  };
};
