import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Gender } from "@rideshare/types";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useProfilePhoto } from "../hooks/useProfilePhoto";

const GENDERS: Gender[] = ["male", "female", "other"];

function initials(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();
  const { upload, uploading } = useProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [gender, setGender] = useState<Gender>(user?.gender ?? "male");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) {
      return;
    }
    setError(null);
    try {
      const publicUrl = await upload(file);
      if (!publicUrl) {
        return;
      }
      const { error: updateError } = await supabase.from("users").update({ photo_url: publicUrl }).eq("id", user.id);
      if (updateError) {
        throw updateError;
      }
      setUser({ ...user, photoUrl: publicUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update photo");
    }
  }

  async function save() {
    if (!user || name.trim().length < 2) {
      setError("Enter your name");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
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
    setSaved(true);
  }

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Your profile</h1>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light text-xl font-bold text-brand-dark disabled:opacity-50"
          >
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name ?? "Profile"} className="h-full w-full object-cover" />
            ) : (
              initials(user.name)
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e)} />
          <div>
            <p className="text-sm font-bold text-ink">{uploading ? "Uploading…" : "Change photo"}</p>
            <p className="text-xs text-ink-faint">{user.phone}</p>
          </div>
          <span className="ml-auto rounded-full bg-brand-light px-3 py-1.5 text-sm font-extrabold text-brand-dark">
            {user.trustScore} Trust
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
          <KycDot ok={user.aadhaarVerified} label="Aadhaar" />
          <KycDot ok={user.dlVerified} label="Driving licence" />
          <KycDot ok={user.faceMatchDone} label="Face match" />
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
            />
          </label>
          <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Gender</p>
          <div className="flex gap-2">
            {GENDERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setGender(value);
                  setSaved(false);
                }}
                className={`flex-1 rounded-full py-2 text-sm font-bold capitalize transition ${
                  gender === value ? "bg-brand text-white" : "bg-paper text-ink-soft"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <MenuRow to="/vehicle" label="My vehicle" subtitle="Manage your car or bike for posting rides" />
        <MenuRow to="/plans" label="My plans" subtitle="Driver and passenger subscription plans" />
        <MenuRow to="/trips" label="My trips" subtitle="Rides you've booked or posted" />
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 w-full rounded-full border border-line py-3 text-sm font-bold text-ink-soft transition hover:border-brand hover:text-brand"
      >
        Sign out
      </button>
    </div>
  );
}

function KycDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-brand" : "bg-line"}`} />
      <span className="text-center text-[11px] font-semibold text-ink-soft">{label}</span>
    </div>
  );
}

function MenuRow({ to, label, subtitle }: { to: string; label: string; subtitle: string }) {
  return (
    <Link to={to} className="flex items-center justify-between px-5 py-4 transition hover:bg-paper">
      <div>
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>
      </div>
      <span className="text-ink-faint">→</span>
    </Link>
  );
}
