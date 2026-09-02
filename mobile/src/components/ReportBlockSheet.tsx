import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ReportReason } from "@rideshare/types";
import { bookingDelete, bookingGet, bookingPost } from "../services/api";
import { t, type AppLanguage } from "../i18n/translations";
import { PrimaryButton } from "./ui/PrimaryButton";
import { softShadow } from "../theme/shadows";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "unsafe_driving", label: "Unsafe driving" },
  { value: "no_show", label: "No-show" },
  { value: "harassment", label: "Harassment" },
  { value: "fraud_or_payment", label: "Fraud / payment issue" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "other", label: "Other" },
];

export function ReportBlockSheet({
  visible,
  onClose,
  language,
  userId,
  userName,
  tripId,
  bookingId,
}: {
  visible: boolean;
  onClose: () => void;
  language: AppLanguage;
  userId: string;
  userName: string;
  tripId?: string;
  bookingId?: string;
}) {
  const [mode, setMode] = useState<"menu" | "report">("menu");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    bookingGet<{ users: Array<{ id: string }> }>("/trust/blocks")
      .then((res) => setIsBlocked(res.users.some((u) => u.id === userId)))
      .catch(() => setIsBlocked(false));
  }, [visible, userId]);

  function reset() {
    setMode("menu");
    setReason(null);
    setDetails("");
    setDone(null);
  }

  async function submitReport() {
    if (!reason) {
      return;
    }
    setSubmitting(true);
    try {
      await bookingPost("/trust/reports", { reportedId: userId, reason, details: details || undefined, tripId, bookingId });
      setDone(t(language, "reportSubmitted"));
    } catch {
      setDone(t(language, "reportSubmitted"));
    } finally {
      setSubmitting(false);
    }
  }

  async function runToggleBlock() {
    setSubmitting(true);
    try {
      if (isBlocked) {
        await bookingDelete("/trust/blocks", { blockedId: userId });
      } else {
        await bookingPost("/trust/blocks", { blockedId: userId });
      }
      onClose();
      reset();
    } catch {
      onClose();
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  function toggleBlock() {
    if (isBlocked) {
      void runToggleBlock();
      return;
    }
    Alert.alert(t(language, "blockUserAction"), t(language, "blockConfirm"), [
      { text: t(language, "cancel"), style: "cancel" },
      { text: t(language, "blockUserAction"), style: "destructive", onPress: () => void runToggleBlock() },
    ]);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        onClose();
        reset();
      }}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}
        onPress={() => {
          onClose();
          reset();
        }}
      >
        <Pressable style={softShadow} className="rounded-t-[28px] bg-white px-5 pb-8 pt-4" onPress={(e) => e.stopPropagation()}>
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-200" />
          {done ? (
            <View className="items-center py-4">
              <Ionicons name="checkmark-circle" size={32} color="#0F766E" />
              <Text className="mt-3 text-center text-slate-700">{done}</Text>
              <View className="mt-4 w-full">
                <PrimaryButton
                  label="OK"
                  onPress={() => {
                    onClose();
                    reset();
                  }}
                />
              </View>
            </View>
          ) : mode === "menu" ? (
            <View>
              <Text className="mb-3 text-lg font-extrabold text-slate-900">{userName}</Text>
              <Pressable onPress={() => setMode("report")} className="flex-row items-center rounded-2xl bg-[#F7FAF9] px-4 py-3.5">
                <Ionicons name="flag-outline" size={18} color="#0F766E" />
                <Text className="ml-3 font-bold text-slate-800">{t(language, "reportUser")}</Text>
              </Pressable>
              <Pressable onPress={() => void toggleBlock()} disabled={submitting} className="mt-2 flex-row items-center rounded-2xl bg-red-50 px-4 py-3.5">
                <Ionicons name="ban-outline" size={18} color="#DC2626" />
                <Text className="ml-3 font-bold text-red-700">
                  {isBlocked ? t(language, "unblockUserAction") : t(language, "blockUserAction")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text className="mb-3 text-lg font-extrabold text-slate-900">{t(language, "reportReasonPrompt")}</Text>
              {REASONS.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setReason(item.value)}
                  className={`mb-2 flex-row items-center rounded-2xl px-4 py-3 ${reason === item.value ? "bg-brand-light" : "bg-[#F7FAF9]"}`}
                >
                  <Ionicons
                    name={reason === item.value ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={reason === item.value ? "#0F766E" : "#94A3B8"}
                  />
                  <Text className="ml-3 font-semibold text-slate-800">{item.label}</Text>
                </Pressable>
              ))}
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder={t(language, "reportDetailsPlaceholder")}
                multiline
                className="mt-1 min-h-[70px] rounded-2xl bg-[#F7FAF9] px-4 py-3 text-slate-800"
              />
              <View className="mt-4">
                <PrimaryButton label={t(language, "submit")} disabled={!reason || submitting} onPress={() => void submitReport()} />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
