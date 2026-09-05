import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AppShell } from "./AppShell";
import { AuthLayout } from "./AuthLayout";
import { Layout } from "./Layout";

export function RootLayout() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const { pathname } = useLocation();
  const isAuthScreen = pathname === "/login" || pathname === "/otp";

  if (sessionToken) {
    return <AppShell />;
  }
  if (isAuthScreen) {
    return <AuthLayout />;
  }
  return <Layout />;
}
