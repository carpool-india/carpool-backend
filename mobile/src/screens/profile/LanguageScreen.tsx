import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type AppLanguage } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { Screen } from "../../components/ui/Screen";
import { softShadow } from "../../theme/shadows";

const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; nativeLabel: string; key: "english" | "hindi" | "tamil" }> = [
  { code: "en", nativeLabel: "English", key: "english" },
  { code: "hi", nativeLabel: "हिन्दी", key: "hindi" },
  { code: "ta", nativeLabel: "தமிழ்", key: "tamil" },
];

export function LanguageScreen() {
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);

  return (
    <Screen variant="stacked">
      <View className="flex-1 bg-canvas px-4 pt-4">
      {LANGUAGE_OPTIONS.map((option) => {
        const active = language === option.code;
        return (
          <Pressable
            key={option.code}
            onPress={() => setLanguage(option.code)}
            style={softShadow}
            className="mb-2.5 flex-row items-center rounded-2xl bg-white px-4 py-4"
          >
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">{option.nativeLabel}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">{t(language, option.key)}</Text>
            </View>
            <Ionicons
              name={active ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={active ? "#0F766E" : "#CBD5E1"}
            />
          </Pressable>
        );
      })}
      </View>
    </Screen>
  );
}
