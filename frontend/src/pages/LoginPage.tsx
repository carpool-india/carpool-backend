import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { indianPhoneSchema } from "@rideshare/utils";
import { notificationPost } from "../services/api";
import { Icon, icons } from "../components/Icon";

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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-7 py-12 sm:px-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">Welcome</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Log in to RideShare</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Enter your Indian mobile number. We'll text a 6-digit code — no password needed.
      </p>

      <form onSubmit={(e) => void submit(e)} className="mt-9">
        <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Mobile number</label>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#E4DCCE] bg-white px-4 py-4 shadow-sm transition focus-within:border-brand focus-within:shadow-glow">
          <span className="text-lg font-extrabold text-ink">+91</span>
          <div className="h-7 w-px bg-[#E4DCCE]" />
          <input
            value={formatLocalPhone(local)}
            onChange={(e) => setLocal(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="98765 43210"
            autoComplete="tel-national"
            autoFocus
            className="w-full bg-transparent text-lg font-bold tracking-wide text-ink outline-none placeholder:font-normal placeholder:text-ink-faint"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || local.length !== 10}
          className="mt-6 w-full rounded-full bg-brand py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#D9D0C2] disabled:text-ink-faint disabled:shadow-none"
        >
          {loading ? "Sending code…" : "Continue"}
        </button>
      </form>

      <ul className="mt-10 space-y-3 text-sm font-semibold text-ink-soft">
        {["Aadhaar + DL verified drivers", "UPI held in escrow until you arrive", "Live tracking and one-tap SOS"].map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
              <Icon path={icons.check} className="h-3.5 w-3.5" />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-ink-faint">
        Not ready to log in?{" "}
        <Link to="/" className="font-bold text-brand hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
