import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { bookingGet, bookingPost } from "../../services/api";
import { navigateRoot } from "../../navigation/navigateRoot";
import { formatInr } from "../../utils/formatCurrency";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../../components/ui/Avatar";
import { ErrorRetry } from "../../components/ui/ErrorRetry";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { ReportBlockSheet } from "../../components/ReportBlockSheet";
import { Screen } from "../../components/ui/Screen";
import { softShadow } from "../../theme/shadows";

interface TripPassenger {
  bookingId: string;
  passengerId: string;
  name: string | null;
  photoUrl: string | null;
  seatsBooked: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  confirmed: { bg: "bg-emerald-50", fg: "text-emerald-700" },
  completed: { bg: "bg-slate-100", fg: "text-slate-600" },
  pending: { bg: "bg-amber-50", fg: "text-amber-700" },
  pending_approval: { bg: "bg-amber-50", fg: "text-amber-700" },
  rejected: { bg: "bg-red-50", fg: "text-red-700" },
};

export function TripPassengersScreen({
  route,
  navigation,
}: {
  route: { params: { tripId: string } };
  navigation: { navigate: (name: string, params?: object) => void };
}) {
  const language = useAuthStore((state) => state.language);
  const [passengers, setPassengers] = useState<TripPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<TripPassenger | null>(null);
  const { tripId } = route.params;

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    bookingGet<{ passengers: TripPassenger[] }>(`/trips/${tripId}/passengers`)
      .then((payload) => setPassengers(payload.passengers))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function respond(bookingId: string, decision: "accept" | "reject") {
    setResponding(bookingId);
    try {
      await bookingPost(`/bookings/${bookingId}/respond`, { decision });
      load();
    } finally {
      setResponding(null);
    }
  }

  return (
    <Screen variant="stacked">
      <View className="flex-1 px-4 pt-4">
        {loadError ? (
          <ErrorRetry language={language} onRetry={load} />
        ) : (
          <FlatList
            data={passengers}
            keyExtractor={(item) => item.bookingId}
            contentContainerStyle={{ paddingBottom: 16 }}
            refreshing={loading}
            onRefresh={load}
            ListEmptyComponent={
              !loading ? (
                <View className="mt-16 items-center px-6">
                  <Ionicons name="people-outline" size={28} color="#94A3B8" />
                  <Text className="mt-3 text-center text-sm text-slate-500">{t(language, "noPassengersYet")}</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const style = STATUS_STYLE[item.status] ?? { bg: "bg-slate-100", fg: "text-slate-600" };
              return (
                <View style={softShadow} className="mb-3 rounded-[22px] bg-white p-3.5">
                  <View className="flex-row items-center">
                    <Avatar photoUrl={item.photoUrl} size={44} />
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-slate-900">{item.name ?? "Passenger"}</Text>
                      <Text className="mt-0.5 text-xs text-slate-500">
                        {item.seatsBooked} seat{item.seatsBooked > 1 ? "s" : ""} · {formatInr(item.totalAmount)}
                      </Text>
                      <View className={`mt-1.5 self-start rounded-full px-2 py-0.5 ${style.bg}`}>
                        <Text className={`text-[10px] font-bold capitalize ${style.fg}`}>
                          {item.status === "pending_approval" ? t(language, "pendingApproval") : item.status.replace("_", " ")}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setReportTarget(item)} hitSlop={8} className="p-1">
                      <Ionicons name="ellipsis-vertical" size={18} color="#94A3B8" />
                    </Pressable>
                  </View>
                  {item.status === "pending_approval" ? (
                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        onPress={() => void respond(item.bookingId, "reject")}
                        disabled={responding === item.bookingId}
                        className="flex-1 items-center rounded-2xl bg-slate-100 py-2.5"
                      >
                        <Text className="text-sm font-bold text-slate-600">{t(language, "rejectRequest")}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void respond(item.bookingId, "accept")}
                        disabled={responding === item.bookingId}
                        className="flex-1 items-center rounded-2xl bg-brand py-2.5"
                      >
                        <Text className="text-sm font-bold text-white">{t(language, "acceptRequest")}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )}
        <View className="mt-2">
          <PrimaryButton
            label={t(language, "chatTitle")}
            onPress={() => navigateRoot(navigation, "Chat", { tripId })}
          />
        </View>
      </View>
      {reportTarget ? (
        <ReportBlockSheet
          visible={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          language={language}
          userId={reportTarget.passengerId}
          userName={reportTarget.name ?? "Passenger"}
          tripId={tripId}
          bookingId={reportTarget.bookingId}
        />
      ) : null}
    </Screen>
  );
}
