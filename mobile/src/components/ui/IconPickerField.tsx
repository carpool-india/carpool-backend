import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export function IconPickerField({
  icon,
  label,
  displayValue,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  displayValue: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</Text>
      <Pressable
        onPress={onPress}
        className="flex-row items-center rounded-2xl border border-slate-100 bg-[#F7FAF9] px-3"
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-light">
          <Ionicons name={icon} size={16} color="#0F766E" />
        </View>
        <Text className="ml-2 flex-1 py-3.5 text-[16px] font-semibold text-slate-900" numberOfLines={1}>
          {displayValue}
        </Text>
      </Pressable>
    </View>
  );
}
