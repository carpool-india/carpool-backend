import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

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

  function setDigit(index: number, digit: string) {
    const next = otp.padEnd(6, " ").split("");
    next[index] = digit;
    const joined = next.join("").replace(/ /g, "").slice(0, 6);
    setOtp(joined);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-7 py-12 sm:px-10">
      <Link to="/login" className="text-sm font-bold text-brand hover:underline">
        ← Change number
      </Link>
      <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Enter the code</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        We sent a 6-digit code to <span className="font-bold text-ink">{phone}</span>
      </p>

      <div className="mt-8 flex justify-between gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            value={otp[index] ?? ""}
            onChange={(e) => setDigit(index, e.target.value.replace(/\D/g, "").slice(-1))}
            onKeyDown={(e) => onKeyDown(index, e.key)}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              setOtp(pasted);
              inputs.current[Math.min(pasted.length, 5)]?.focus();
            }}
            inputMode="numeric"
            maxLength={1}
            className="h-14 w-full rounded-2xl border border-[#E4DCCE] bg-white text-center text-xl font-extrabold text-ink outline-none transition focus:border-brand focus:shadow-glow"
          />
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-5 text-center">
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
        className="mt-6 w-full rounded-full bg-brand py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#D9D0C2] disabled:text-ink-faint disabled:shadow-none"
      >
        {loading ? "Verifying…" : "Verify & continue"}
      </button>
    </div>
  );
}
