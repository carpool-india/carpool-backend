import { Linking, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { softShadow } from "../../theme/shadows";

export function HelpScreen() {
  const language = useAuthStore((state) => state.language);

  return (
    <Screen variant="stacked" scroll>
      <View className="px-4 pt-4">
      <HelpItem
        icon="navigate"
        title={t(language, "helpLiveGpsTitle")}
        body={t(language, "helpLiveGpsBody")}
      />
      <HelpItem
        icon="keypad"
        title={t(language, "helpOtpTitle")}
        body={t(language, "helpOtpBody")}
      />
      <HelpItem
        icon="alert-circle"
        title={t(language, "helpSosTitle")}
        body={t(language, "helpSosBody")}
        tone="danger"
      />
      <HelpItem
        icon="shield-checkmark"
        title={t(language, "helpKycTitle")}
        body={t(language, "helpKycBody")}
      />

      <View style={softShadow} className="mt-2 rounded-[24px] bg-white p-4">
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-400">{t(language, "helpContactUs")}</Text>
        <Text className="mt-2 text-sm leading-5 text-slate-600">{t(language, "helpContactBody")}</Text>
        <View className="mt-3">
          <PrimaryButton label={t(language, "helpCallSupport")} onPress={() => void Linking.openURL("tel:112")} />
        </View>
      </View>
      </View>
    </Screen>
  );
}

function HelpItem({
  icon,
  title,
  body,
  tone = "brand",
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  tone?: "brand" | "danger";
}) {
  return (
    <View style={softShadow} className="mb-3 flex-row rounded-[24px] bg-white p-4">
      <View className={`h-11 w-11 items-center justify-center rounded-2xl ${tone === "danger" ? "bg-red-50" : "bg-brand-light"}`}>
        <Ionicons name={icon} size={20} color={tone === "danger" ? "#DC2626" : "#0F766E"} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-extrabold text-slate-900">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-slate-600">{body}</Text>
      </View>
    </View>
  );
}
