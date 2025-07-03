// src/components/Sidebar.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaUpload, FaPenNib, FaCog, FaSignOutAlt, FaUser } from "react-icons/fa";
import styles from "./Sidebar.module.css";

const version = "v1.0.0";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const links = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/upload", label: "Upload PDF", icon: <FaUpload /> },
    { path: "/sign", label: "Sign PDF", icon: <FaPenNib /> },
    { path: "/profile", label: "Profile", icon: <FaUser /> },
    { path: "/settings", label: "Settings", icon: <FaCog /> },
  ];

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <span>SignifyPro</span>
      </div>
      {/* Navigation Links */}
      <nav className={styles.menu}>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `${styles["menu-link"]} ${isActive ? styles.active : ""}`
            }
            style={{ position: "relative" }}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className={styles["active-indicator"]} />}
                <span className={styles["menu-icon"]}>{link.icon}</span>
                <span className={styles["menu-label"]}>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles["logout-btn"]} onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: 8 }} /> Logout
        </button>
        <span className={styles["version-info"]}>{version}</span>
      </div>
    </aside>
  );
};

export default Sidebar;
