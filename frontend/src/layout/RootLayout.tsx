import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { AppShell } from "./AppShell";
import { AuthLayout } from "./AuthLayout";
import { Layout } from "./Layout";

const pageTitles: Record<string, string> = {
  "/": "Good company. Great journeys.", "/search": "Find a ride", "/login": "Log in",
  "/otp": "Verify your number", "/trips": "My trips", "/post": "Offer a ride",
  "/profile": "Your profile", "/profile-setup": "Set up your profile", "/kyc": "Verify your identity",
  "/vehicle": "Your vehicles", "/plans": "Membership plans",
};

export function RootLayout() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const { pathname } = useLocation();
  const language = useAuthStore((state) => state.language);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const isAuthScreen = pathname === "/login" || pathname === "/otp";
  useEffect(() => {
    document.title = `${pageTitles[pathname] ?? (pathname.endsWith("/live") ? "Live journey" : pathname.endsWith("/book") ? "Confirm booking" : pathname.endsWith("/confirmed") ? "Booking confirmed" : "Your ride")} | RideShare India`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  if (pathname === "/") return <Layout />;
  if (isAuthScreen) return <AuthLayout />;
  if (sessionToken) return <AppShell />;
  return <Layout />;
}
