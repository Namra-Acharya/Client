import { useState, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../styles/topbar.css";

export default function Topbar({ user = { name: "Namra", avatar: "N" }, theme = "light", onToggleTheme }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications] = useState(3); // Example: 3 unread notifications
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Toggle profile dropdown
  const handleProfileClick = () => setShowProfileMenu((prev) => !prev);

  const handleMenuClick = (action) => {
    setShowProfileMenu(false);
    if (action === 'profile') navigate('/profile');
    else if (action === 'settings') navigate('/settings');
    else if (action === 'logout') {
      // Placeholder: Add logout logic here
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-logo">SignifyPro</div>
      </div>
      <div className="topbar-right" style={{ gap: 16 }}>
        <div className="notifications">
          <FaBell />
          {notifications > 0 && <span className="notif-badge">{notifications}</span>}
        </div>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div className="profile-info" ref={profileMenuRef}>
          <div className="profile-avatar" onClick={handleProfileClick}>
            {user.avatar}
          </div>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <ul>
                <li style={{ color: 'var(--color-text-main)' }} onClick={() => handleMenuClick('profile')}>Profile</li>
                <li style={{ color: 'var(--color-text-main)' }} onClick={() => handleMenuClick('settings')}>Settings</li>
                <li style={{ color: 'var(--color-text-main)' }} onClick={() => handleMenuClick('logout')}>Logout</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
