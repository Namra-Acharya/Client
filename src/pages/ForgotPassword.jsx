import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { baseURL } from "../utils/apiBase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Placeholder API call (replace with actual backend route when ready)
      const res = await axios.post(`${baseURL}/api/auth/forgot-password`, { email });
      toast.success("✅ Reset link sent to your email!");
      console.log(res.data);
    } catch (err) {
      console.error("Forgot password error:", err.response?.data || err.message);
      toast.error("❌ Failed to send reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 px-4">
      <div
        className={`bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-700 ease-out transform ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl font-bold text-center text-white mb-4 tracking-tight">
          Forgot Password?
        </h2>
        <p className="text-sm text-gray-300 text-center mb-6">
          Enter your email address to receive password reset instructions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform focus:scale-[1.02]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-6">
          Remembered your password?{" "}
          <a href="/login" className="text-indigo-400 hover:underline font-medium">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
