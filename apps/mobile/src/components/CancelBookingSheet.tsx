import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bookingPost, paymentPost } from "../services/api";
import { t, type AppLanguage } from "../i18n/translations";
import { PrimaryButton } from "./ui/PrimaryButton";
import { softShadow } from "../theme/shadows";

interface CancelResult {
  bondForfeited: boolean;
  amountInr: number;
  reason: string;
  feeRefundPaise: number;
  feeRefundPolicy: string;
}

export function CancelBookingSheet({
  visible,
  onClose,
  onCancelled,
  language,
  bookingId,
  cancelledBy,
}: {
  visible: boolean;
  onClose: () => void;
  onCancelled: () => void;
  language: AppLanguage;
  bookingId: string;
  cancelledBy: "passenger" | "driver";
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CancelResult | null>(null);

  function reset() {
    setReason("");
    setError(null);
    setResult(null);
  }

  async function submit() {
    if (reason.trim().length < 3) {
      setError("Enter a short reason (min 3 characters)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = await bookingPost<CancelResult>(`/bookings/${bookingId}/cancel`, {
        reason: reason.trim(),
        cancelledBy,
      });
      if (payload.feeRefundPaise > 0) {
        await paymentPost("/refund", {
          bookingId,
          reason: payload.feeRefundPolicy,
          amountPaise: payload.feeRefundPaise,
        }).catch(() => undefined);
      }
      setResult(payload);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking");
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
          {result ? (
            <View className="items-center py-4">
              <Ionicons name="checkmark-circle" size={32} color="#0F766E" />
              <Text className="mt-3 text-center font-bold text-slate-800">{t(language, "bookingCancelled")}</Text>
              <Text className="mt-1.5 text-center text-sm leading-5 text-slate-500">{result.feeRefundPolicy}</Text>
              {result.bondForfeited ? (
                <Text className="mt-1.5 text-center text-sm leading-5 text-amber-700">
                  ₹{result.amountInr} cancellation bond forfeited
                </Text>
              ) : null}
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
          ) : (
            <View>
              <Text className="mb-3 text-lg font-extrabold text-slate-900">{t(language, "cancelBookingTitle")}</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={t(language, "cancelReasonPlaceholder")}
                multiline
                className="min-h-[70px] rounded-2xl bg-[#F7FAF9] px-4 py-3 text-slate-800"
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
                  <Text className="font-bold text-slate-600">{t(language, "keepBooking")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void submit()}
                  disabled={submitting}
                  className="flex-1 items-center rounded-2xl bg-sos py-3.5"
                >
                  <Text className="font-bold text-white">{submitting ? t(language, "cancelling") : t(language, "confirmCancel")}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
