import type { ReactNode } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function LogoMark({ size = 64, inverted }: { size?: number; inverted?: boolean }) {
  return (
    <View
      className={`items-center justify-center rounded-3xl ${inverted ? "bg-white" : "bg-brand"}`}
      style={{ width: size, height: size }}
    >
      <Ionicons name="car-sport" size={Math.round(size * 0.46)} color={inverted ? "#0F766E" : "#FFFFFF"} />
    </View>
  );
}

export function DecorativeHero({ children, safeTop = false }: { children: ReactNode; safeTop?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="overflow-hidden bg-brand" style={safeTop ? { paddingTop: insets.top } : undefined}>
      <View className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-teal-500 opacity-40" />
      <View className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-teal-900 opacity-30" />
      <View className="absolute right-16 bottom-6 h-16 w-16 rounded-full bg-white opacity-10" />
      {children}
    </View>
  );
}
