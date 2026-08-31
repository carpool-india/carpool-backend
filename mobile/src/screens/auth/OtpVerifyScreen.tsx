import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { otp6Schema } from "@rideshare/utils";
import { useSupabaseAuth } from "../../hooks/useSupabaseAuth";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpVerifyScreen({
  route,
  navigation,
}: {
  route: { params: { phone: string } };
  navigation: { replace: (name: string) => void };
}) {
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const language = useAuthStore((state) => state.language);
  const { sendOtp, verifyOtp, loading, error } = useSupabaseAuth();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function resend() {
    if (cooldown > 0 || loading) {
      return;
    }
    await sendOtp(route.params.phone);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function submit() {
    const parsed = otp6Schema.safeParse(otp);
    if (!parsed.success) {
      return;
    }
    const user = await verifyOtp(route.params.phone, parsed.data);
    if (!user.name) {
      navigation.replace("ProfileSetup");
      return;
    }
    if (!user.aadhaarVerified || !user.faceMatchDone) {
      navigation.replace("Kyc");
      return;
    }
    navigation.replace("Main");
  }

  return (
    <Screen variant="stacked">
      <View className="flex-1 px-6 pt-10">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
          <Ionicons name="lock-closed" size={24} color="#0F766E" />
        </View>
        <Text className="mt-5 text-3xl font-extrabold text-slate-900">{t(language, "otpTitle")}</Text>
        <Text className="mt-2 text-base text-slate-500">
          {t(language, "otpSubtitle")}{" "}
          <Text className="font-bold text-brand">{route.params.phone}</Text>
        </Text>
        <TextInput
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          className="mt-8 rounded-[28px] bg-white py-5 text-center text-4xl font-extrabold tracking-[12px] text-slate-900"
          placeholder="000000"
          placeholderTextColor="#CBD5E1"
        />
        {error ? <Text className="mt-3 text-sm text-sos">{error}</Text> : null}
        <View className="mt-4 items-center">
          {cooldown > 0 ? (
            <Text className="text-sm text-slate-400">
              {t(language, "resendOtpIn").replace("{s}", String(cooldown))}
            </Text>
          ) : (
            <Pressable onPress={() => void resend()} disabled={loading}>
              <Text className="text-sm font-bold text-brand">{t(language, "resendOtp")}</Text>
            </Pressable>
          )}
        </View>
        <View className="mt-8">
          <PrimaryButton label={t(language, "verify")} loading={loading} onPress={() => void submit()} />
        </View>
      </View>
    </Screen>
  );
}
