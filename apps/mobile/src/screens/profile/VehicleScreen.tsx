import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { vehicleNumberSchema } from "@rideshare/utils";
import type { VehicleType } from "@rideshare/types";
import { t } from "../../i18n/translations";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { useDriverVehicles } from "../../hooks/useDriverVehicles";
import { Screen } from "../../components/ui/Screen";
import { IconField } from "../../components/ui/IconField";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { softShadow, cardShadow } from "../../theme/shadows";

export function VehicleScreen() {
  const user = useAuthStore((state) => state.user);
  const language = useAuthStore((state) => state.language);
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

  if (loading) {
    return (
      <Screen variant="stacked">
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="stacked">
      <View className="flex-1 px-4 pt-4">
      <Text className="mb-3 text-sm text-slate-500">{t(language, "myVehicleSubtitle")}</Text>
      <View style={softShadow} className="rounded-[24px] bg-white p-4">
        <View className="mb-3 flex-row rounded-2xl bg-[#F4F7F6] p-1">
          {(["car", "bike"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => selectType(option)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${vehicleType === option ? "bg-white" : ""}`}
              style={vehicleType === option ? cardShadow : undefined}
            >
              <Ionicons
                name={option === "car" ? "car-sport" : "bicycle"}
                size={16}
                color={vehicleType === option ? "#0F766E" : "#94A3B8"}
              />
              <Text className={`text-sm font-bold ${vehicleType === option ? "text-brand" : "text-slate-500"}`}>
                {option === "car" ? t(language, "vehicleCar") : t(language, "vehicleBike")}
              </Text>
            </Pressable>
          ))}
        </View>
        <IconField
          icon="pricetag-outline"
          label={t(language, "vehicleNumber")}
          value={current.number}
          onChange={setNumber}
          placeholder="TN09AB1234"
        />
        {error ? <Text className="mt-1 text-sm text-sos">{error}</Text> : null}
        <View className="mt-2">
          <PrimaryButton label={saved ? t(language, "saved") : t(language, "save")} loading={saving} onPress={() => void save()} />
        </View>
      </View>
      </View>
    </Screen>
  );
}
