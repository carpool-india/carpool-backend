import { useCallback, useState } from "react";
import type { VehicleType } from "@rideshare/types";
import { supabase } from "../lib/supabase";

export interface VehicleEntry {
  id: string | null;
  number: string;
}

export function emptyVehicles(): Record<VehicleType, VehicleEntry> {
  return { car: { id: null, number: "" }, bike: { id: null, number: "" } };
}

export function useDriverVehicles(userId: string | undefined) {
  const [vehicles, setVehicles] = useState<Record<VehicleType, VehicleEntry>>(emptyVehicles());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return emptyVehicles();
    }
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .select("id, vehicle_type, registration_number")
      .eq("driver_id", userId)
      .order("created_at", { ascending: false });
    const next = emptyVehicles();
    if (data) {
      for (const row of data as { id: string; vehicle_type: string; registration_number: string }[]) {
        const type: VehicleType = row.vehicle_type === "bike" ? "bike" : "car";
        if (!next[type].id) {
          next[type] = { id: row.id, number: row.registration_number.toUpperCase() };
        }
      }
    }
    setVehicles(next);
    setLoading(false);
    return next;
  }, [userId]);

  return { vehicles, setVehicles, loading, reload };
}
