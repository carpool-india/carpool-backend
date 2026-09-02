import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Gender } from "@rideshare/types";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

const GENDERS: Gender[] = ["male", "female", "other"];

export function ProfileSetupPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [name, setName] = useState(user?.name ?? "");
  const [gender, setGender] = useState<Gender>(user?.gender ?? "male");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!user || name.trim().length < 2) {
      setError("Enter your name");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({ name: name.trim(), gender })
      .eq("id", user.id)
      .select("*")
      .single();
    setSaving(false);
    if (updateError || !updated) {
      setError(updateError?.message ?? "Unable to save profile");
      return;
    }
    setUser({ ...user, name: updated.name as string, gender: updated.gender as Gender });
    navigate(from ?? "/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">A few details</h1>
      <p className="mt-2 text-sm text-ink-soft">A name helps co-riders trust you.</p>
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
          />
        </label>
        <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Gender</p>
        <div className="flex gap-2">
          {GENDERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGender(value)}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold capitalize transition ${
                gender === value ? "bg-brand text-white" : "bg-paper text-ink-soft"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-6 w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}
