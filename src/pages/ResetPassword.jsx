import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { baseURL } from "../utils/apiBase";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${baseURL}/api/auth/reset-password/${token}`, {
        password,
      });

      toast.success("✅ Password reset successful!", {
        position: "top-center",
        theme: "dark",
        autoClose: 2500,
      });

      navigate("/login");
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("❌ Reset failed: " + (err.response?.data?.message || "Something went wrong."), {
        position: "top-center",
        theme: "dark",
      });
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 px-4">
      <div className={`bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-700 ease-out transform ${
        fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        <h2 className="text-2xl font-bold text-center text-white mb-4 tracking-tight">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform focus:scale-[1.02]"
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
