import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  // If route requires admin and user is NOT an admin, kick them to home
  if (adminOnly && user.user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}
