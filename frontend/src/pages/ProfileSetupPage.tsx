import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Gender } from "@rideshare/types";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { Card, fieldInputClass, Page, PageHeader, PrimaryButton, SegmentedControl } from "../components/ui";

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
    <Page width="sm">
      <PageHeader title="A few details" subtitle="A name helps co-riders trust you." />
      <Card className="p-6">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className={fieldInputClass}
          />
        </label>
        <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Gender</p>
        <SegmentedControl value={gender} options={GENDERS.map((value) => ({ value, label: value }))} onChange={setGender} capitalize />
      </Card>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <PrimaryButton type="button" onClick={() => void save()} disabled={saving} className="mt-6 w-full">
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </Page>
  );
}
