import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppwrite } from "../../hooks/useAppwrite";

const SetupMFA: React.FC = () => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [mfaSetup, setMfaSetup] = useState(false);
  const navigate = useNavigate();
  const { setupMFA, verifyMFA, enableMFA } = useAppwrite();

  const handleSetupMFA = async () => {
    try {
      const secret = await setupMFA();
      const qr = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(secret.uri)}&size=200x200`;
      setQrUrl(qr);
      setMfaSetup(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to set up MFA");
    }
  };

  const handleVerifyMFA = async () => {
    try {
      await verifyMFA(otp);
      await enableMFA();
      toast.success("✅ MFA enabled successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Invalid code, please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md text-center text-slate-700">
        {!mfaSetup ? (
          <>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Set Up Multi-Factor Authentication</h2>
            <p className="text-gray-600 mb-4">Add an extra layer of security to your account.</p>
            <button
              onClick={handleSetupMFA}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Generate QR Code
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Scan this QR Code</h2>
            {qrUrl && <img src={qrUrl} alt="MFA QR Code" className="mx-auto my-4" />}
            <p className="text-gray-600 mb-4">
              Scan with Google Authenticator or Authy, then enter your 6-digit code:
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="border p-2 rounded w-full text-center"
            />
            <button
              onClick={handleVerifyMFA}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Verify & Enable MFA
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SetupMFA;
