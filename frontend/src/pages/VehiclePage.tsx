import { useEffect, useState } from "react";
import type { VehicleType } from "@rideshare/types";
import { vehicleNumberSchema } from "@rideshare/utils";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useDriverVehicles } from "../hooks/useDriverVehicles";

export function VehiclePage() {
  const user = useAuthStore((state) => state.user);
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const { vehicles, setVehicles, loading, reload } = useDriverVehicles(user?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const current = vehicles[vehicleType];

  useEffect(() => {
    void reload();
  }, [reload]);

  function selectType(next: VehicleType) {
    setVehicleType(next);
    setError(null);
    setSaved(false);
  }

  function setNumber(value: string) {
    const upper = value.toUpperCase();
    setVehicles((prev) => ({ ...prev, [vehicleType]: { ...prev[vehicleType], number: upper } }));
    setSaved(false);
  }

  async function save() {
    if (!user) {
      return;
    }
    const parsed = vehicleNumberSchema.safeParse(current.number);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid vehicle number");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload = { driver_id: user.id, vehicle_type: vehicleType, registration_number: parsed.data };
    const { data, error: saveError } = current.id
      ? await supabase.from("vehicles").update(payload).eq("id", current.id).select("id").single()
      : await supabase.from("vehicles").insert(payload).select("id").single();
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setVehicles((prev) => ({
      ...prev,
      [vehicleType]: { id: (data?.id as string | undefined) ?? prev[vehicleType].id, number: parsed.data },
    }));
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Your vehicle</h1>
      <p className="mt-2 text-sm text-ink-soft">Add your car or bike so you can start posting rides.</p>

      {loading ? (
        <p className="mt-8 text-sm text-ink-faint">Loading…</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="mb-4 flex gap-2 rounded-2xl bg-paper p-1">
            {(["car", "bike"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectType(option)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition ${
                  vehicleType === option ? "bg-white text-brand shadow-card" : "text-ink-soft"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Registration number</span>
            <input
              value={current.number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="TN09AB1234"
              className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold uppercase tracking-wide text-ink outline-none placeholder:font-normal placeholder:normal-case focus:border-brand"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-5 w-full rounded-full bg-brand py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save vehicle"}
          </button>
        </div>
      )}
    </div>
  );
}
