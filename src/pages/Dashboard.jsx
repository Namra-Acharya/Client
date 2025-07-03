import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import axios from "axios";
import { baseURL } from "../utils/apiBase";

export default function Dashboard() {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    document.documentElement.setAttribute("data-theme", theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const userRes = await axios.get(`${baseURL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data.user);
        // Fetch PDF list for stats and recent
        const pdfRes = await axios.get(`${baseURL}/api/pdf/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const files = pdfRes.data.files || [];
        setStats([
          { label: "Total Documents", value: files.length, icon: "📄", color: "var(--color-secondary)" },
        ]);
        setRecent(files.slice(-5).reverse().map(f => ({ name: f, uploaded: "-" })));
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[var(--color-card-bg)] text-[var(--color-text-main)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar
          user={user ? { name: user.name, avatar: user.name ? user.name[0] : "U" } : { name: "User", avatar: "U" }}
          pageTitle="Dashboard"
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <main className="flex-1 p-8 overflow-y-auto animate-fadeIn">
          {loading ? (
            <div className="text-center text-lg">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-4">Welcome, {user?.name} 👋</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl shadow hover:shadow-lg transition-transform duration-150 hover:-translate-y-1 flex flex-col items-center p-6"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
              >
                <div className="text-3xl mb-2" style={{ color: stat.color }}>{stat.icon}</div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-base text-[var(--color-text-main)] opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="bg-[var(--color-card-bg)] rounded-xl overflow-hidden shadow border border-[var(--color-border)] animate-fadeIn">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-table-header)] text-[var(--color-primary)] uppercase">
                  <tr>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Uploaded</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((doc, i) => (
                    <tr key={i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-table-row-alt)] transition">
                      <td className="p-4">{doc.name}</td>
                      <td className="p-4">{doc.uploaded}</td>
                      <td className="p-4 flex gap-2">
                            <a href={`http://localhost:5000/uploads/${doc.name}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] underline transition-all">View</a>
                            <a href={`http://localhost:5000/api/pdf/download/${doc.name}`} className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] underline transition-all">Download</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: none; }
            }
            .animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1) both; }
          `}</style>
        </main>
      </div>
    </div>
  );
}
