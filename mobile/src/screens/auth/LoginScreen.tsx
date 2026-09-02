import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { indianPhoneSchema } from "@rideshare/utils";
import { useSupabaseAuth } from "../../hooks/useSupabaseAuth";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { brandGlow } from "../../theme/shadows";
import { containedScrollProps } from "../../components/ui/containedScroll";

function formatLocalPhone(digits: string): string {
  const next = digits.slice(0, 10);
  if (next.length <= 5) {
    return next;
  }
  return `${next.slice(0, 5)} ${next.slice(5)}`;
}

export function LoginScreen({
  navigation,
}: {
  navigation: { navigate: (name: string, params?: { phone: string }) => void };
}) {
  const [phone, setPhone] = useState("+91");
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);
  const { sendOtp, loading, error } = useSupabaseAuth();
  const insets = useSafeAreaInsets();
  const local = phone.replace(/^\+91/, "");

  async function submit() {
    const parsed = indianPhoneSchema.safeParse(phone);
    if (!parsed.success) {
      return;
    }
    await sendOtp(parsed.data);
    navigation.navigate("OtpVerify", { phone: parsed.data });
  }

  return (
    <View className="flex-1 bg-[#042F2E]" style={{ overflow: "hidden" }}>
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: "#042F2E",
          zIndex: 50,
        }}
      />
      <LinearGradient colors={["#042F2E", "#0F766E", "#2DD4BF"]} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            removeClippedSubviews={false}
            {...containedScrollProps}
          >
            <View className="flex-1 px-6 pt-2" style={{ paddingTop: insets.top + 8 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" }}
                  >
                    <Ionicons name="car-sport" size={20} color="#FFFFFF" />
                  </View>
                  <Text className="ml-2.5 text-sm font-bold tracking-wide text-white">{t(language, "appName")}</Text>
                </View>
                <View className="flex-row rounded-full p-0.5" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
                  {(["en", "hi", "ta"] as const).map((code) => (
                    <Pressable
                      key={code}
                      onPress={() => setLanguage(code)}
                      className={`rounded-full px-2.5 py-1 ${language === code ? "bg-white" : ""}`}
                    >
                      <Text className={`text-[11px] font-bold ${language === code ? "text-brand" : "text-white"}`}>
                        {code.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-1 justify-center pb-4">
                <Text className="text-[34px] font-extrabold leading-[40px] text-white">{t(language, "loginHeadline")}</Text>
                <Text className="mt-3 text-base text-teal-50">{t(language, "loginTagline")}</Text>
                <RouteArt fromLabel={t(language, "from")} toLabel={t(language, "to")} />
              </View>
            </View>

            <View
              className="rounded-t-[36px] bg-white px-6 pt-6"
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            >
              <View className="mb-5 items-center">
                <View className="h-1.5 w-12 rounded-full bg-slate-200" />
              </View>
              <Text className="text-xl font-extrabold text-slate-900">{t(language, "loginTitle")}</Text>
              <Text className="mt-1.5 text-sm leading-5 text-slate-500">{t(language, "loginSubtitle")}</Text>

              <View
                className="mt-5 flex-row items-center rounded-[22px] border border-slate-100 bg-[#F4F7F6] px-3"
                style={{ shadowColor: "#0F766E", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
              >
                <IndiaFlag />
                <Text className="ml-2.5 text-base font-extrabold text-slate-900">+91</Text>
                <View className="mx-2 h-6 w-px bg-slate-200" />
                <TextInput
                  value={formatLocalPhone(local)}
                  onChangeText={(value) => setPhone(`+91${value.replace(/\D/g, "").slice(0, 10)}`)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  importantForAutofill="no"
                  className="flex-1 py-[18px] text-[18px] font-bold tracking-wide text-slate-900"
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                />
                {local.length === 10 ? <Ionicons name="checkmark-circle" size={22} color="#0F766E" /> : null}
              </View>
              {error ? <Text className="mt-2 text-sm text-sos">{error}</Text> : null}

              <Pressable
                disabled={loading || local.length !== 10}
                onPress={() => void submit()}
                style={local.length === 10 && !loading ? brandGlow : undefined}
                className={`mt-5 flex-row items-center justify-center rounded-full py-[18px] ${
                  local.length === 10 ? "bg-[#042F2E]" : "bg-slate-200"
                }`}
              >
                <Text className={`text-base font-bold ${local.length === 10 ? "text-white" : "text-slate-500"}`}>
                  {loading ? "Please wait…" : t(language, "getOtp")}
                </Text>
                {!loading ? (
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={local.length === 10 ? "#FFFFFF" : "#94A3B8"}
                    style={{ marginLeft: 8 }}
                  />
                ) : null}
              </Pressable>

              <View className="mt-4 flex-row items-center justify-center">
                <Ionicons name="chatbubble-ellipses" size={15} color="#0F766E" />
                <Text className="ml-2 text-xs font-semibold text-slate-500">{t(language, "loginOtpChannel")}</Text>
              </View>

              <View className="mt-5 flex-row gap-2">
                <TrustTile icon="shield-checkmark" label={t(language, "loginTrustKyc")} />
                <TrustTile icon="card" label={t(language, "loginTrustUpi")} />
                <TrustTile icon="alert-circle" label={t(language, "sosChip")} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

function IndiaFlag() {
  return (
    <View className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200">
      <View className="h-[10px] bg-[#FF9933]" />
      <View className="h-[10px] items-center justify-center bg-white">
        <View className="h-1.5 w-1.5 rounded-full border border-[#000080]" />
      </View>
      <View className="h-[10px] bg-[#138808]" />
    </View>
  );
}

function RouteArt({ fromLabel, toLabel }: { fromLabel: string; toLabel: string }) {
  return (
    <View
      className="mt-8 overflow-hidden rounded-[28px] px-5 py-5"
      style={{ backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}
    >
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.16)" }}>
          <Ionicons name="radio-button-on" size={18} color="#FFFFFF" />
        </View>
        <View className="mx-3 flex-1">
          <View className="flex-row items-center">
            <View className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
            <View className="mx-2 h-12 w-12 items-center justify-center rounded-full bg-white">
              <Ionicons name="car-sport" size={22} color="#0F766E" />
            </View>
            <View className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
          </View>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-400">
          <Ionicons name="flag" size={18} color="#042F2E" />
        </View>
      </View>
      <View className="mt-3 flex-row justify-between">
        <Text className="text-xs font-bold uppercase tracking-wider text-teal-100">{fromLabel}</Text>
        <Text className="text-xs font-bold uppercase tracking-wider text-teal-100">{toLabel}</Text>
      </View>
    </View>
  );
}

function TrustTile({
  icon,
  label,
}: {
  icon: "shield-checkmark" | "card" | "alert-circle";
  label: string;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-[#F4F7F6] px-2 py-3">
      <Ionicons name={icon} size={16} color="#0F766E" />
      <Text className="mt-1 text-center text-[10px] font-bold text-slate-600">{label}</Text>
    </View>
  );
}
