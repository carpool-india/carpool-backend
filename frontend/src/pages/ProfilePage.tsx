import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Gender } from "@rideshare/types";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useProfilePhoto } from "../hooks/useProfilePhoto";
import { Avatar, Card, fieldInputClass, GhostButton, Page, PageHeader, PrimaryButton, SegmentedControl, TrustBadge } from "../components/ui";
import { Icon, icons } from "../components/Icon";

const GENDERS: Gender[] = ["male", "female", "other"];

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
    <Page width="lg">
      <PageHeader title="Your profile" subtitle="Photo, KYC status, and the details co-riders see." />

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative disabled:opacity-50"
          >
            <Avatar name={user.name} photoUrl={user.photoUrl} size="lg" />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white shadow-card">
              +
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">{uploading ? "Uploading…" : "Change photo"}</p>
            <p className="text-xs text-ink-faint">{user.phone}</p>
          </div>
          <TrustBadge score={user.trustScore} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
          <KycDot ok={user.aadhaarVerified} label="Aadhaar" />
          <KycDot ok={user.dlVerified} label="Driving licence" />
          <KycDot ok={user.faceMatchDone} label="Face match" />
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              className={fieldInputClass}
            />
          </label>
          <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Gender</p>
          <SegmentedControl
            value={gender}
            options={GENDERS.map((value) => ({ value, label: value }))}
            onChange={(value) => {
              setGender(value);
              setSaved(false);
            }}
            capitalize
          />
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving} className="mt-5">
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </PrimaryButton>
        </div>
      </Card>

      <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <MenuRow to="/vehicle" label="My vehicle" subtitle="Manage your car or bike for posting rides" />
        <MenuRow to="/plans" label="My plans" subtitle="Driver and passenger subscription plans" />
        <MenuRow to="/trips" label="My trips" subtitle="Rides you've booked or posted" />
      </div>

      <GhostButton type="button" onClick={handleSignOut} className="mt-6 w-full">
        Sign out
      </GhostButton>
    </Page>
  );
}

function KycDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-paper px-2 py-4">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ok ? "bg-brand text-white" : "bg-line text-ink-faint"}`}>
        <Icon path={ok ? icons.check : icons.close} className="h-4 w-4" />
      </span>
      <span className="text-center text-[11px] font-semibold text-ink-soft">{label}</span>
    </div>
  );
}

function MenuRow({ to, label, subtitle }: { to: string; label: string; subtitle: string }) {
  return (
    <Link to={to} className="flex items-center justify-between border-b border-line px-5 py-4 last:border-b-0 transition hover:bg-paper">
      <div>
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>
      </div>
      <Icon path={icons.arrowRight} className="h-4 w-4 text-ink-faint" />
    </Link>
  );
}
