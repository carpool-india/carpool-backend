import { useEffect, useState } from "react";
import type { VehicleType } from "@rideshare/types";
import { vehicleNumberSchema } from "@rideshare/utils";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useDriverVehicles } from "../hooks/useDriverVehicles";
import { Card, fieldInputClass, Page, PageHeader, PrimaryButton, SegmentedControl } from "../components/ui";

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
    <Page width="sm">
      <PageHeader title="Your vehicle" subtitle="Add your car or bike so you can start posting rides." />

      {loading ? (
        <div className="skeleton h-56 rounded-3xl" />
      ) : (
        <Card className="p-6">
          <SegmentedControl
            value={vehicleType}
            options={[
              { value: "car" as const, label: "Car" },
              { value: "bike" as const, label: "Bike" },
            ]}
            onChange={selectType}
          />
          <label className="mt-5 block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Registration number</span>
            <input
              value={current.number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="TN09AB1234"
              className={`${fieldInputClass} uppercase tracking-wide placeholder:normal-case`}
            />
          </label>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving} className="mt-6 w-full">
            {saving ? "Saving…" : saved ? "Saved" : "Save vehicle"}
          </PrimaryButton>
        </Card>
      )}
    </Page>
  );
}
