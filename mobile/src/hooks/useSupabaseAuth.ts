import { useCallback, useRef, useState } from "react";
import type { User } from "@rideshare/types";
import { supabase } from "../lib/supabase";
import { notificationPost } from "../services/api";
import { useAuthStore } from "../store/authStore";

interface OtpSession {
  access_token: string;
  refresh_token: string;
  user: { id: string };
}

function mapUser(row: Record<string, unknown>, authId: string, phone: string): User {
  return {
    id: String(row.id),
    supabaseAuthId: authId,
    phone: String(row.phone ?? phone),
    name: (row.name as string | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    gender: (row.gender as User["gender"]) ?? null,
    role: (row.role as User["role"]) ?? "passenger",
    trustScore: Number(row.trust_score ?? 0),
    aadhaarVerified: Boolean(row.aadhaar_verified),
    dlVerified: Boolean(row.dl_verified),
    faceMatchDone: Boolean(row.face_match_done),
    isActive: row.is_active !== false,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function useSupabaseAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const verified = useRef<{ phone: string; token: string; session: OtpSession } | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const sendOtp = useCallback(async (phone: string) => {
    if (inFlight.current) throw new Error("Please wait for the current request.");
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      await notificationPost("/auth/otp/request", { phone });
      verified.current = null;
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : "Unable to send OTP");
      throw otpError;
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      if (inFlight.current) throw new Error("Please wait for the current request.");
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        // Profile/session setup can be retried without submitting an already consumed OTP.
        let session = verified.current?.phone === phone && verified.current.token === token
          ? verified.current.session
          : null;
        if (!session) {
          const result = await notificationPost<{ session: OtpSession }>("/auth/otp/verify", {
            phone,
            otp: token,
          });
          session = result.session;
          verified.current = { phone, token, session };
        }

        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (setSessionError) throw setSessionError;

        const { data: existing, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("supabase_auth_id", session.user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        let row = existing;
        if (!row) {
          const inserted = await supabase
            .from("users")
            .insert({ supabase_auth_id: session.user.id, phone, role: "passenger" })
            .select("*")
            .single();
          if (inserted.error || !inserted.data) {
            throw inserted.error ?? new Error("Unable to create profile");
          }
          row = inserted.data;
        }

        const user = mapUser(row as Record<string, unknown>, session.user.id, phone);
        setSession(session.access_token, session.refresh_token, user);
        verified.current = null;
        return user;
      } catch (verifyError) {
        const message = verifyError && typeof verifyError === "object" && "message" in verifyError
          ? String(verifyError.message)
          : "OTP verification failed. Please try again.";
        setError(message);
        throw verifyError;
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [setSession]
  );

  return { sendOtp, verifyOtp, loading, error };
}
