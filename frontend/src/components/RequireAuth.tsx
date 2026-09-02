import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const location = useLocation();

  if (!sessionToken) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
  }
  return <>{children}</>;
}
