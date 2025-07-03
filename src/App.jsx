import { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import UploadPDF from "./pages/UploadPDF";
import PDFSigner from "./pages/PDFSigner";
import PrivateRoute from "./components/PrivateRoute";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

// Theme Context (optional)
export const ThemeContext = createContext();

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("dark");
    if (stored !== null) setDarkMode(stored === "true");
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      localStorage.setItem("dark", !prev);
      return !prev;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <div className={darkMode ? "app-container dark-mode" : "app-container"}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/register" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/upload" element={<PrivateRoute><UploadPDF /></PrivateRoute>} />
            <Route path="/sign" element={<PrivateRoute><PDFSigner /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </Router>
      </div>
    </ThemeContext.Provider>
  );
}
