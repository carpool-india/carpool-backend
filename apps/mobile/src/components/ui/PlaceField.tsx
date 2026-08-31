import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { AppLanguage } from "../../i18n/translations";
import type { MapPlace } from "../../services/places";
import { geocodePlace } from "../../services/places";
import { PlacePicker } from "./PlacePicker";

export type { MapPlace };

export { geocodePlace };

export function PlaceField({
  icon,
  label,
  place,
  placeholder,
  language,
  onSelect,
  embedded = false,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  place: MapPlace | null;
  placeholder: string;
  language: AppLanguage;
  onSelect: (place: MapPlace) => void;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className={embedded ? "" : "mb-3"}>
      <Text className={`mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${embedded ? "px-3 pt-2.5" : ""}`}>
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center px-3 ${embedded ? "pb-2.5 pt-0.5" : "rounded-2xl border border-slate-100 bg-[#F7FAF9] py-3.5"}`}
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-light">
          <Ionicons name={icon} size={16} color="#0F766E" />
        </View>
        <View className="ml-2 flex-1">
          <Text
            className={`text-[16px] font-semibold ${place ? "text-slate-900" : "text-slate-400"}`}
            numberOfLines={1}
          >
            {place?.name || placeholder}
          </Text>
          {place?.address && place.address !== place.name ? (
            <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
              {place.address}
            </Text>
          ) : null}
        </View>
        <Ionicons name={embedded ? "chevron-forward" : "search"} size={16} color="#94A3B8" />
      </Pressable>
      <PlacePicker
        visible={open}
        title={placeholder}
        language={language}
        onClose={() => setOpen(false)}
        onConfirm={(next) => {
          onSelect(next);
          setOpen(false);
        }}
      />
    </View>
  );
}
