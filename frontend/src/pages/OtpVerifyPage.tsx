import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { otp6Schema } from "@rideshare/utils";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { phone?: string; from?: string } | null;
  const phone = state?.phone;
  const from = state?.from;
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const { sendOtp, verifyOtp, loading, error } = useSupabaseAuth();

  useEffect(() => {
    if (!phone) {
      navigate("/login", { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!phone) {
    return null;
  }

  async function resend() {
    if (cooldown > 0 || loading) {
      return;
    }
    await sendOtp(phone!);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function submit() {
    const parsed = otp6Schema.safeParse(otp);
    if (!parsed.success) {
      return;
    }
    const user = await verifyOtp(phone!, parsed.data);
    if (!user.name) {
      navigate("/profile-setup", { replace: true, state: { from } });
      return;
    }
    navigate(from ?? "/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Enter the code</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We sent a 6-digit code to <span className="font-bold text-brand">{phone}</span>
      </p>
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        className="mt-8 w-full rounded-2xl bg-white py-5 text-center text-4xl font-extrabold tracking-[0.5em] text-ink shadow-card outline-none placeholder:text-line"
      />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 text-center">
        {cooldown > 0 ? (
          <p className="text-sm text-ink-faint">Resend code in {cooldown}s</p>
        ) : (
          <button type="button" onClick={() => void resend()} disabled={loading} className="text-sm font-bold text-brand">
            Resend code
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={loading || otp.length !== 6}
        className="mt-8 w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint disabled:shadow-none"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
    </div>
  );
}
