import { useState, useEffect } from "react";
import axios from "axios";
import { baseURL } from "../utils/apiBase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      const res = await axios.post(`${baseURL}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("✅ Login successful!", {
        position: "top-center",
        autoClose: 2500,
        theme: "dark",
        pauseOnHover: false,
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error("❌ Login failed. Check credentials.", {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
        pauseOnHover: false,
      });
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 px-4">
      <div
        className={`bg-white/5 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-700 ease-out transform ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-3xl font-bold text-center text-white mb-6 tracking-tight">
          Welcome Back
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform"
            required
          />
          <input
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform"
            required
          />
          <div className="flex justify-end">
            <a href="/forgot-password" className="text-sm text-indigo-400 hover:underline">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-indigo-400 hover:underline font-medium">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
