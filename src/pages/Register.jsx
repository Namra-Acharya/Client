import { useState, useEffect } from "react";
import axios from "axios";
import { baseURL } from "../utils/apiBase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/auth/register`, form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("✅ Registration Successful!", {
        position: "top-center",
        autoClose: 2500,
        theme: "dark",
        pauseOnHover: false,
      });

      navigate("/dashboard");
    } catch (err) {
      toast.error("❌ " + (err.response?.data?.message || "Registration failed"), {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
        pauseOnHover: false,
      });
    } finally {
      setLoading(false);
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
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:scale-[1.02] transition-transform"
            required
          />
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:scale-[1.02] transition-transform"
            required
          />
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:scale-[1.02] transition-transform"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded-lg ${
              loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
            } text-white transition-all duration-200 shadow-md`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-400 hover:underline font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
