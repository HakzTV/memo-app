import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppwrite } from "../../hooks/useAppwrite";
import PhoneInput from "react-phone-input-2";
import { Eye24Regular, EyeOff24Regular } from "@fluentui/react-icons";
import "react-phone-input-2/lib/style.css";

const Signup: React.FC = () => {
  const { signup } = useAppwrite();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 👈 new state
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const navigate = useNavigate();

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success("Account created! Please verify your email.");
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-sm bg-gray-900/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-center text-white mb-6 flex items-center justify-center gap-2">
          <UserPlus className="w-6 h-6" /> Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
            required
          />
{/* 👇 phone number field */}
<PhoneInput
  country={"gh"}
  value={phone}
  onChange={(value) => setPhone(value)}
  enableSearch
  placeholder="Phone number"
  containerClass="w-full"
  buttonClass="!bg-gray-800 !border-gray-700 !text-white hover:!bg-gray-700 !h-[48px] !rounded-l-lg"
  dropdownClass="!bg-gray-900 !text-white !border-gray-700 [&>.country:hover]:!bg-gray-700 [&>.country:hover]:!text-white"
  inputClass="!w-full !bg-gray-800 !text-white !rounded-r-lg !h-[48px] !pl-14 focus:!ring-2 focus:!ring-purple-500 !border-0"
/>



          {/* 👇 password field with eye icon */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
            </button>
          </div>

          {/* 👇 confirm password */}
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 ${
              confirmPassword && !passwordsMatch ? "ring-2 ring-red-500" : ""
            }`}
            required
          />

          {/* 👇 show mismatch warning */}
          {confirmPassword && !passwordsMatch && (
            <p className="text-red-400 text-sm text-center">
              Passwords do not match
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !passwordsMatch}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
              passwordsMatch
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Signup;
