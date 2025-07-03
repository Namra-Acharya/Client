import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  // Simple token presence check (can enhance with jwt-decode if needed)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
