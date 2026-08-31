import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { TrustScoreBadge } from "../../components/TrustScoreBadge";
import { Avatar } from "../../components/ui/Avatar";
import { t } from "../../i18n/translations";
import { supabase } from "../../lib/supabase";
import { navigateRoot } from "../../navigation/navigateRoot";
import type { TabScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { useProfilePhoto } from "../../hooks/useProfilePhoto";
import { DecorativeHero } from "../../components/ui/LogoMark";
import { GhostButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { softShadow } from "../../theme/shadows";

export function ProfileScreen({ navigation }: TabScreenProps<"ProfileTab">) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useAuthStore((state) => state.language);
  const signOut = useAuthStore((state) => state.signOut);
  const { pick, uploading } = useProfilePhoto();
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function logout() {
    await supabase.auth.signOut();
    signOut();
    navigateRoot(navigation, "Login");
  }

  async function changePhoto() {
    if (!user) {
      return;
    }
    setPhotoError(null);
    try {
      const publicUrl = await pick(user.id);
      if (!publicUrl) {
        return;
      }
      const { error } = await supabase.from("users").update({ photo_url: publicUrl }).eq("id", user.id);
      if (error) {
        throw error;
      }
      setUser({ ...user, photoUrl: publicUrl });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Unable to update photo");
    }
  }

  return (
    <Screen variant="hero" scroll>
      <DecorativeHero safeTop>
        <View className="px-5 pb-14 pt-3">
              <Text className="text-sm font-semibold uppercase tracking-[2px] text-teal-100">
                {t(language, "account")}
              </Text>
              <View className="mt-4 flex-row items-center">
                <Pressable onPress={() => void changePhoto()} disabled={uploading} style={{ position: "relative" }}>
                  <View className="rounded-full border-2 border-white" style={{ opacity: uploading ? 0.5 : 1 }}>
                    <Avatar photoUrl={user?.photoUrl} name={user?.name} size={64} />
                  </View>
                  <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-teal-900 bg-white">
                    <Ionicons name="camera" size={12} color="#0F766E" />
                  </View>
                </Pressable>
                <View className="ml-3 flex-1">
                  <Text className="text-xl font-extrabold text-white">{user?.name ?? "Rider"}</Text>
                  <Text className="text-teal-100">{user?.phone}</Text>
                  {photoError ? <Text className="mt-1 text-xs text-red-200">{photoError}</Text> : null}
                </View>
                <TrustScoreBadge score={user?.trustScore ?? 0} light />
              </View>
            </View>
        </DecorativeHero>

        <View style={softShadow} className="-mt-8 mx-4 flex-row rounded-[24px] bg-white p-3">
          <KycDot ok={Boolean(user?.aadhaarVerified)} label="Aadhaar" />
          <KycDot ok={Boolean(user?.dlVerified)} label="DL" />
          <KycDot ok={Boolean(user?.faceMatchDone)} label="Face" />
        </View>

        <Text className="mx-5 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">
          {t(language, "account")}
        </Text>
        <MenuRow
          icon="shield-checkmark-outline"
          label={t(language, "kycTitle")}
          onPress={() => navigateRoot(navigation, "Kyc")}
        />
        <MenuRow icon="calendar-outline" label={t(language, "myTrips")} onPress={() => navigation.navigate("RidesTab")} />
        <MenuRow
          icon="car-sport-outline"
          label={t(language, "myVehicle")}
          onPress={() => navigateRoot(navigation, "Vehicle")}
        />
        <MenuRow
          icon="ribbon-outline"
          label={t(language, "myPlans")}
          subtitle={t(language, "myPlansSubtitle")}
          onPress={() => navigateRoot(navigation, "Plans")}
        />
        <MenuRow
          icon="card-outline"
          label={t(language, "payments")}
          subtitle="Platform fee via Razorpay UPI · fare paid directly to driver"
          onPress={() => navigateRoot(navigation, "Payments")}
        />
        <MenuRow
          icon="alert-circle-outline"
          label={t(language, "emergencyContacts")}
          subtitle={t(language, "safetyStrip")}
          onPress={() => navigateRoot(navigation, "EmergencyContacts")}
        />
        <MenuRow
          icon="help-circle-outline"
          label={t(language, "helpSafety")}
          onPress={() => navigateRoot(navigation, "Help")}
        />
        <MenuRow
          icon="language-outline"
          label={t(language, "language")}
          subtitle={t(language, language === "en" ? "english" : language === "hi" ? "hindi" : "tamil")}
          onPress={() => navigateRoot(navigation, "Language")}
        />

        <View className="mx-4 mt-5">
          <GhostButton label="Sign out" onPress={() => void logout()} />
        </View>
    </Screen>
  );
}

function KycDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View className="flex-1 items-center py-1">
      <Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={18} color={ok ? "#0F766E" : "#94A3B8"} />
      <Text className="mt-1 text-[11px] font-bold text-slate-600">{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={softShadow} className="mx-4 mt-2 flex-row items-center rounded-[22px] bg-white px-4 py-4">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-light">
        <Ionicons name={icon} size={18} color="#0F766E" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-bold text-slate-900">{label}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
    </Pressable>
  );
}
