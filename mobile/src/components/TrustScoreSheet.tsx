import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { bookingGet } from "../services/api";
import { t, type AppLanguage } from "../i18n/translations";
import { trustLabel } from "../utils/trustScore";

interface TrustScoreBreakdown {
  total: number;
  kycPoints: number;
  kycMax: number;
  aadhaarVerified: boolean;
  dlVerified: boolean;
  faceMatchDone: boolean;
  ratingPoints: number;
  ratingMax: number;
  averageStars: number;
  ratingCount: number;
  completionPoints: number;
  completionMax: number;
  completedTrips: number;
  cancellationPenalty: number;
  cancellations: number;
  fraudPenalty: number;
  fraudFlags: number;
}

export function TrustScoreSheet({
  visible,
  onClose,
  userId,
  isSelf,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string;
  isSelf: boolean;
  language: AppLanguage;
}) {
  const [data, setData] = useState<TrustScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) {
      return;
    }
    setLoading(true);
    setData(null);
    bookingGet<TrustScoreBreakdown>(`/trust/score?userId=${userId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [visible, userId]);

  const penaltyTotal = data ? data.cancellationPenalty + data.fraudPenalty : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable className="rounded-t-[28px] bg-white px-5 pb-8 pt-4" onPress={(e) => e.stopPropagation()}>
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-200" />
          {loading || !data ? (
            <View className="items-center py-10">
              <Text className="text-slate-400">{t(language, "trustScoreLoading")}</Text>
            </View>
          ) : (
            <>
              <View className="items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-light">
                  <Ionicons name="shield-checkmark" size={28} color="#0F766E" />
                </View>
                <Text className="mt-2 text-3xl font-extrabold text-slate-900">{data.total}</Text>
                <Text className="text-sm font-bold text-brand">{trustLabel(data.total)}</Text>
              </View>
              <Text className="mt-4 text-center text-sm leading-5 text-slate-500">
                {t(language, isSelf ? "trustScoreIntroSelf" : "trustScoreIntroOther")}
              </Text>

              <View className="mt-5">
                <ScoreRow
                  icon="shield-checkmark-outline"
                  label={t(language, "trustScoreKyc")}
                  points={data.kycPoints}
                  max={data.kycMax}
                  detail={t(
                    language,
                    data.aadhaarVerified && data.dlVerified && data.faceMatchDone
                      ? "trustScoreKycAllDone"
                      : "trustScoreKycPartial"
                  )}
                />
                <ScoreRow
                  icon="star-outline"
                  label={t(language, "trustScoreRatings")}
                  points={data.ratingPoints}
                  max={data.ratingMax}
                  detail={
                    data.ratingCount === 0
                      ? t(language, "trustScoreRatingsNone")
                      : `${data.averageStars}★ · ${data.ratingCount} ${t(language, "trustScoreRatingsCount")}`
                  }
                />
                <ScoreRow
                  icon="checkmark-done-outline"
                  label={t(language, "trustScoreTrips")}
                  points={data.completionPoints}
                  max={data.completionMax}
                  detail={`${data.completedTrips} ${t(language, "trustScoreTripsCount")}`}
                />
                {penaltyTotal > 0 ? (
                  <ScoreRow
                    icon="remove-circle-outline"
                    label={t(language, "trustScorePenalties")}
                    points={penaltyTotal}
                    max={0}
                    detail={t(language, "trustScorePenaltiesDetail")}
                    negative
                  />
                ) : null}
              </View>

              {isSelf ? (
                <Text className="mt-4 text-center text-xs leading-5 text-slate-400">
                  {t(language, "trustScoreImproveSelf")}
                </Text>
              ) : null}

              <Pressable onPress={onClose} className="mt-5 items-center rounded-full bg-[#F4F7F6] py-3.5">
                <Text className="font-bold text-slate-600">{t(language, "trustScoreClose")}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ScoreRow({
  icon,
  label,
  points,
  max,
  detail,
  negative,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  points: number;
  max: number;
  detail: string;
  negative?: boolean;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, points / max)) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name={icon} size={16} color={negative ? "#DC2626" : "#0F766E"} />
          <Text className="ml-2 font-bold text-slate-800">{label}</Text>
        </View>
        <Text className={`font-bold ${negative ? "text-red-600" : "text-slate-700"}`}>
          {negative ? `−${points}` : `${points}/${max}`}
        </Text>
      </View>
      {!negative ? (
        <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <View className="h-full rounded-full bg-brand" style={{ width: `${pct * 100}%` }} />
        </View>
      ) : null}
      <Text className="mt-1 text-xs text-slate-400">{detail}</Text>
    </View>
  );
}
