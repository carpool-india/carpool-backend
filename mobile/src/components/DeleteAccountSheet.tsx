import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bookingPost } from "../services/api";
import { t, type AppLanguage } from "../i18n/translations";
import { softShadow } from "../theme/shadows";

export function DeleteAccountSheet({
  visible,
  onClose,
  onDeleted,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  onDeleted: () => void;
  language: AppLanguage;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canConfirm = confirmText.trim().toUpperCase() === "DELETE";

  function reset() {
    setConfirmText("");
    setError(null);
  }

  async function confirmDelete() {
    if (!canConfirm) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await bookingPost("/account/delete", {});
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete account");
    } finally {
      setSubmitting(false);
    }
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
          <View className="items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="warning-outline" size={24} color="#DC2626" />
            </View>
            <Text className="mt-3 text-lg font-extrabold text-slate-900">{t(language, "deleteAccountTitle")}</Text>
          </View>
          <Text className="mt-3 text-center text-sm leading-5 text-slate-600">
            {t(language, "deleteAccountBody")}
          </Text>
          <View className="mt-4 rounded-2xl bg-[#F7FAF9] px-4 py-3">
            <Text className="text-xs leading-4 text-slate-500">{t(language, "deleteAccountList")}</Text>
          </View>
          <Text className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
            {t(language, "deleteAccountPrompt")}
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect={false}
            textAlignVertical="center"
            style={{ includeFontPadding: false }}
            className="mt-2 rounded-2xl bg-[#F7FAF9] px-4 py-3.5 text-[16px] font-semibold text-slate-900"
          />
          {error ? <Text className="mt-2 text-xs text-sos">{error}</Text> : null}
          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={() => {
                onClose();
                reset();
              }}
              className="flex-1 items-center rounded-2xl bg-slate-100 py-3.5"
            >
              <Text className="font-bold text-slate-600">{t(language, "back")}</Text>
            </Pressable>
            <Pressable
              onPress={() => void confirmDelete()}
              disabled={!canConfirm || submitting}
              className={`flex-1 items-center rounded-2xl py-3.5 ${canConfirm ? "bg-sos" : "bg-red-100"}`}
            >
              <Text className={`font-bold ${canConfirm ? "text-white" : "text-red-300"}`}>
                {submitting ? t(language, "deleteAccountDeleting") : t(language, "deleteAccountConfirm")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
