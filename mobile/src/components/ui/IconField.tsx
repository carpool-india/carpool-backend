import { Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export function IconField({
  icon,
  label,
  value,
  onChange,
  keyboard,
  placeholder,
  editable = true,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboard?: "numeric" | "phone-pad" | "number-pad";
  placeholder?: string;
  editable?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</Text>
      <View className={`flex-row items-center rounded-2xl border border-slate-100 px-3 ${editable ? "bg-[#F7FAF9]" : "bg-slate-100"}`}>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-light">
          <Ionicons name={icon} size={16} color="#0F766E" />
        </View>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? label}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboard}
          editable={editable}
          textAlignVertical="center"
          style={{ includeFontPadding: false }}
          className="ml-2 flex-1 py-3.5 text-[16px] font-semibold text-slate-900"
        />
      </View>
    </View>
  );
}
