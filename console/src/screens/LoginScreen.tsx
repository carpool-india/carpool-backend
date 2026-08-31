import { useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "dineshemur@gmail.com";
const ADMIN_PASSWORD = "dinesh@1993";

export function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfo(
          "Account created. An existing admin needs to grant you access before you can sign in — ask them to flip your is_admin flag."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-lg">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
            R
          </div>
          <div>
            <div className="text-[13px] font-semibold tracking-tight text-slate-900">RideShare</div>
            <div className="text-[11px] font-medium text-slate-500">Admin console</div>
          </div>
        </div>

        <div className="mb-5 hidden rounded-full bg-slate-100 p-1 text-sm font-semibold">
          <button
            className={`flex-1 rounded-full py-2 transition ${mode === "signin" ? "bg-white text-brand shadow-sm" : "text-slate-500"}`}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`flex-1 rounded-full py-2 transition ${mode === "signup" ? "bg-white text-brand shadow-sm" : "text-slate-500"}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Email
            <input
              type="email"
              required
              value={ADMIN_EMAIL}
              readOnly
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-brand"
              placeholder="you@rideshareindia.in"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={ADMIN_PASSWORD}
              readOnly
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
