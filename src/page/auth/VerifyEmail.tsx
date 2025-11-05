import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { account } from "../../lib/appwrite";
import toast from "react-hot-toast";

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<"checking" | "unverified" | "verified">("checking");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(location.search);
      const secret = params.get("secret");

      // If there's a secret param, confirm verification
      if (secret) {
        try {
          const currentUser = await account.get();
          await account.updateVerification({ userId: currentUser.$id, secret });
          toast.success("Email verified successfully!");
          setStatus("verified");

          // Redirect to MFA setup page after a short delay
          setTimeout(() => navigate("/setup-mfa"), 1500);
          return;
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : "Verification failed.";
          setMessage(errMsg);
          toast.error(errMsg);
          setStatus("unverified");
          return;
        }
      }

      // No secret param — check if already verified
      try {
        const user = await account.get();
        if (user.emailVerification) {
          setStatus("verified");
          setTimeout(() => navigate("/setup-mfa"), 1000);
        } else {
          setStatus("unverified");
        }
      } catch {
        setMessage("Please log in or open the link from your email.");
        setStatus("unverified");
      }
    };

    verify();
  }, [location.search, navigate]);

  const resendVerification = async () => {
    try {
      await account.createVerification(`${window.location.origin}/verify-email`);
      toast.success("Verification email sent! Check your inbox.");
      setMessage("Verification email resent.");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to send verification link.";
      toast.error(errMsg);
      setMessage(errMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl text-slate-700 shadow-md text-center">
        {status === "checking" && <p>Checking verification status...</p>}

        {status === "verified" && (
          <div>
            <h2 className="text-green-600 text-xl font-semibold">✅ Email Verified!</h2>
            <p className="mt-2 text-gray-600">
              Redirecting you to MFA setup...
            </p>
          </div>
        )}

        {status === "unverified" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800">Verify Your Email</h2>
            <p className="mt-2 text-gray-600">
              Please check your inbox for a verification link.
            </p>
            <button
              onClick={resendVerification}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Resend Verification Email
            </button>
            {message && <p className="mt-3 text-sm text-gray-500">{message}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
