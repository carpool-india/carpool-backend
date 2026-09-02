import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { indianPhoneSchema } from "@rideshare/utils";
import { notificationPost } from "../services/api";

function formatLocalPhone(digits: string): string {
  const next = digits.slice(0, 10);
  if (next.length <= 5) {
    return next;
  }
  return `${next.slice(0, 5)} ${next.slice(5)}`;
}

export function LoginPage() {
  const [local, setLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const phone = `+91${local}`;
    const parsed = indianPhoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await notificationPost("/auth/otp/request", { phone: parsed.data });
      navigate("/otp", { state: { phone: parsed.data, from } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Log in to book a ride</h1>
      <p className="mt-2 text-sm text-ink-soft">We'll send a one-time code to verify your number.</p>
      <form onSubmit={(e) => void submit(e)} className="mt-8">
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-card">
          <span className="text-base font-extrabold text-ink">+91</span>
          <div className="h-6 w-px bg-line" />
          <input
            value={formatLocalPhone(local)}
            onChange={(e) => setLocal(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="98765 43210"
            className="w-full bg-transparent text-base font-bold tracking-wide text-ink outline-none placeholder:text-ink-faint placeholder:font-normal"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || local.length !== 10}
          className="mt-5 w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint disabled:shadow-none"
        >
          {loading ? "Please wait…" : "Get OTP"}
        </button>
      </form>
    </div>
  );
}
