import { useAuthStore } from "../store/authStore";
import { AppShell } from "./AppShell";
import { Layout } from "./Layout";

export function RootLayout() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  return sessionToken ? <AppShell /> : <Layout />;
}
