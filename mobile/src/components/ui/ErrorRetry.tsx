import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type AppLanguage } from "../../i18n/translations";

export function ErrorRetry({ language, onRetry }: { language: AppLanguage; onRetry: () => void }) {
  return (
    <View className="mt-16 items-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Ionicons name="cloud-offline-outline" size={28} color="#DC2626" />
      </View>
      <Text className="mt-4 text-center text-slate-500">{t(language, "loadFailed")}</Text>
      <Pressable onPress={onRetry} className="mt-4 flex-row items-center rounded-full bg-brand px-5 py-2.5">
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text className="ml-2 text-sm font-bold text-white">{t(language, "retry")}</Text>
      </Pressable>
    </View>
  );
}
