import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAppwrite } from "../../hooks/useAppwrite";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const { login, verifyMFAChallenge } = useAppwrite();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!requiresMFA) {
      const result = await login(email, password);

      if (result.requiresMFA) {
        if (result.challengeId) {
          setRequiresMFA(true);
          setChallengeId(result.challengeId);
          toast("Enter your 6-digit authenticator code");
        } else {
          toast.error("MFA challenge ID missing. Please try again.");
        }
        return;
      }

      toast.success("Logged in successfully!");
      navigate("/");
    }
    } catch (err: unknown) {
      const error = err as { requiresMFA?: boolean; challengeId?: string; message?: string };
      if (error.requiresMFA) {
        setRequiresMFA(true);
        setChallengeId(error.challengeId ?? "");
        toast("Enter your 6-digit authenticator code");
      } else {
        toast.error(error.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!otp.trim()) return toast.error("Please enter your code");
  if (!challengeId) return toast.error("Challenge ID missing. Please log in again.");

  setLoading(true);
    try {
      await verifyMFAChallenge(challengeId, otp);
      toast.success("MFA verified!");
      navigate("/");
    } catch (err: unknown) {
       const error = err as { requiresMFA?: boolean; challengeId?: string; message?: string };
  if (error.requiresMFA) {
    setRequiresMFA(true);
    setChallengeId(error.challengeId ?? "");
    toast("Enter your 6-digit authenticator code");
  } else {
    toast.error(error.message || "Login failed");
  }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-sm bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-center text-white mb-6 flex items-center justify-center gap-2">
          <LogIn className="w-6 h-6" /> Sign In
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Don’t have an account?{" "}
          <a href="/signup" className="text-indigo-400 hover:underline">
            Create one
          </a>
        </p>
      </div>

      {/* MFA Modal */}
      <AnimatePresence>
        {requiresMFA && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border border-gray-700 p-6 rounded-2xl w-[90%] max-w-sm shadow-xl text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex flex-col items-center gap-3">
                <ShieldCheck className="text-indigo-400 w-10 h-10" />
                <h3 className="text-xl font-semibold text-white">MFA Required</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Enter your 6-digit authenticator code to continue.
                </p>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-center tracking-widest text-lg"
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                />

                <button
                  onClick={handleVerifyMFA}
                  disabled={loading}
                  className={`w-full py-3 mt-3 rounded-lg font-semibold text-white transition ${
                    loading
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
                <button onClick={() => setRequiresMFA(false)} className="text-gray-400 text-sm mt-2 hover:text-white">
  Cancel
</button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Login;
