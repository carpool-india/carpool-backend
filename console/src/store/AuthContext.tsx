import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { bookingGet } from "../lib/api";

type AdminStatus = "checking" | "authorized" | "not-authorized";

interface AuthContextValue {
  session: Session | null;
  status: AdminStatus;
  signOut: () => Promise<void>;
  recheckAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AdminStatus>("checking");
  const [loaded, setLoaded] = useState(false);

  async function checkAdmin() {
    try {
      await bookingGet("/admin/overview");
      setStatus("authorized");
    } catch {
      setStatus("not-authorized");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!session) {
      setStatus("checking");
      return;
    }
    void checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, loaded]);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setStatus("checking");
  }

  return (
    <AuthContext.Provider value={{ session, status, signOut, recheckAdmin: checkAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
