import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { Booking, Trip } from "@rideshare/types";
import { bookingGet, paymentGet, paymentPost } from "../../services/api";
import { openUpiCheckout } from "../../services/razorpay";
import { formatInr } from "../../utils/formatCurrency";
import { formatTripWhen } from "../../utils/datetime";
import { t } from "../../i18n/translations";
import type { TabScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { navigateRoot } from "../../navigation/navigateRoot";
import { useTripStore } from "../../store/tripStore";
import { CancelBookingSheet } from "../../components/CancelBookingSheet";
import { ErrorRetry } from "../../components/ui/ErrorRetry";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { RouteTimeline } from "../../components/ui/RouteTimeline";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { softShadow } from "../../theme/shadows";

type RideFilter = "upcoming" | "past" | "cancelled";
type RideKind = "booked" | "offered";

export function MyTripsScreen({ navigation }: TabScreenProps<"RidesTab">) {
  const language = useAuthStore((state) => state.language);
  const setActiveBooking = useTripStore((state) => state.setActiveBooking);
  const [kind, setKind] = useState<RideKind>("booked");
  const [filter, setFilter] = useState<RideFilter>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookingsError, setBookingsError] = useState(false);
  const [tripsError, setTripsError] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const loadBookings = useCallback(() => {
    setBookingsError(false);
    bookingGet<{ bookings: Booking[] }>("/bookings/me")
      .then((payload) => setBookings(payload.bookings))
      .catch(() => setBookingsError(true));
  }, []);

  const loadTrips = useCallback(() => {
    setTripsError(false);
    bookingGet<{ trips: Trip[] }>("/trips")
      .then((payload) => setTrips(payload.trips))
      .catch(() => setTripsError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
      loadTrips();
    }, [loadBookings, loadTrips])
  );

  const filteredBookings = bookings.filter((item) => matchesFilter(item.status, item.trip?.departureTime ?? null, filter));
  const filteredTrips = trips.filter((item) => matchesFilter(item.status, item.departureTime, filter));

  return (
    <Screen variant="plain">
      <Text className="px-5 pt-3 text-3xl font-extrabold text-slate-900">{t(language, "myTrips")}</Text>
      <View className="mx-5 mt-4 flex-row rounded-full bg-white p-1" style={softShadow}>
        <Segment active={kind === "booked"} label={t(language, "booked")} onPress={() => setKind("booked")} />
        <Segment active={kind === "offered"} label={t(language, "offered")} onPress={() => setKind("offered")} />
      </View>
      <View className="mx-5 mt-3 flex-row rounded-full bg-white p-1" style={softShadow}>
        {(["upcoming", "past", "cancelled"] as const).map((value) => (
          <Segment key={value} active={filter === value} label={t(language, value)} onPress={() => setFilter(value)} />
        ))}
      </View>
      {kind === "booked" && bookingsError ? (
        <ErrorRetry language={language} onRetry={loadBookings} />
      ) : kind === "offered" && tripsError ? (
        <ErrorRetry language={language} onRetry={loadTrips} />
      ) : kind === "booked" ? (
        <FlatList
          className="mt-3 flex-1 px-4"
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          {...containedScrollProps}
          ListEmptyComponent={
            <EmptyRides
              icon="search"
              message={t(language, "ridesEmptyBooked")}
              action={t(language, "findRide")}
              onPress={() => navigation.navigate("SearchTab")}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setActiveBooking(item);
                navigateRoot(navigation, "ActiveTrip");
              }}
              style={softShadow}
              className="mb-3 rounded-[24px] bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <StatusPill status={item.status} />
                <Text className="text-lg font-extrabold text-brand">{formatInr(item.totalAmount)}</Text>
              </View>
              {item.trip ? (
                <View className="mt-3">
                  <RouteTimeline origin={item.trip.originName} destination={item.trip.destinationName} />
                  <Text className="mt-2 text-xs text-slate-500">{formatTripWhen(item.trip.departureTime)}</Text>
                </View>
              ) : null}
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-sm text-slate-500">{item.seatsBooked} seats</Text>
                <View className="flex-row items-center gap-2">
                  {item.status !== "cancelled" && item.status !== "rejected" && item.status !== "completed" ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setCancelTarget(item);
                      }}
                      className="rounded-full bg-red-50 px-3 py-1.5"
                    >
                      <Text className="text-xs font-bold text-red-600">Cancel</Text>
                    </Pressable>
                  ) : null}
                  {item.status !== "cancelled" && item.status !== "rejected" ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        navigateRoot(navigation, "Chat", { tripId: item.tripId });
                      }}
                      className="flex-row items-center rounded-full bg-brand-light px-3 py-1.5"
                    >
                      <Ionicons name="chatbubble-ellipses" size={14} color="#0F766E" />
                      <Text className="ml-1.5 text-xs font-bold text-brand">{t(language, "chatTitle")}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          className="mt-3 flex-1 px-4"
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          {...containedScrollProps}
          ListEmptyComponent={
            <EmptyRides
              icon="add-circle"
              message={t(language, "ridesEmptyPublished")}
              action={t(language, "postRide")}
              onPress={() => navigation.navigate("PublishTab")}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigateRoot(navigation, "TripPassengers", { tripId: item.id })}
              style={softShadow}
              className="mb-3 rounded-[24px] bg-white p-4"
            >
              <RouteTimeline origin={item.originName} destination={item.destinationName} />
              <Text className="mt-3 text-sm text-slate-500">
                {formatTripWhen(item.departureTime)} · {item.seatsAvailable}/{item.seatsTotal} seats
              </Text>
              <View className="mt-2 flex-row items-center justify-between">
                <StatusPill status={item.status} />
                {item.status !== "cancelled" ? (
                  <View className="flex-row items-center rounded-full bg-brand-light px-3 py-1.5">
                    <Ionicons name="people" size={14} color="#0F766E" />
                    <Text className="ml-1.5 text-xs font-bold text-brand">{t(language, "tripPassengersTitle")}</Text>
                  </View>
                ) : null}
              </View>
              {!item.cancellationBondPaid && item.status !== "cancelled" ? <BondPrompt tripId={item.id} /> : null}
            </Pressable>
          )}
        />
      )}
      {cancelTarget ? (
        <CancelBookingSheet
          visible={Boolean(cancelTarget)}
          onClose={() => setCancelTarget(null)}
          onCancelled={loadBookings}
          language={language}
          bookingId={cancelTarget.id}
          cancelledBy="passenger"
        />
      ) : null}
    </Screen>
  );
}

function BondPrompt({ tripId }: { tripId: string }) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payBond() {
    setPaying(true);
    setError(null);
    try {
      const order = await paymentPost<{ orderId: string; amountPaise: number }>("/trip-bond/order", { tripId });
      await openUpiCheckout(order.orderId, order.amountPaise / 100);
      const status = await paymentGet<{ status: string }>(`/trip-bond/status?tripId=${tripId}`);
      if (status.status === "paid") {
        setPaid(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  if (paid) {
    return (
      <View className="mt-3 flex-row items-center rounded-2xl bg-emerald-50 px-3 py-2.5">
        <Ionicons name="checkmark-circle" size={16} color="#047857" />
        <Text className="ml-2 text-xs font-bold text-emerald-800">Cancellation bond paid</Text>
      </View>
    );
  }

  return (
    <View className="mt-3">
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          void payBond();
        }}
        disabled={paying}
        className="flex-row items-center justify-between rounded-2xl bg-amber-50 px-3 py-2.5"
      >
        <View className="flex-row items-center">
          <Ionicons name="shield-outline" size={16} color="#A15A05" />
          <Text className="ml-2 text-xs font-bold text-amber-800">
            {paying ? "Processing…" : "Pay ₹150 cancellation bond"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#A15A05" />
      </Pressable>
      {error ? <Text className="mt-1.5 text-xs text-sos">{error}</Text> : null}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const bg =
    status === "confirmed" || status === "active" || status === "in_progress"
      ? "bg-emerald-50"
      : status === "cancelled"
        ? "bg-red-50"
        : "bg-slate-100";
  const fg =
    status === "confirmed" || status === "active" || status === "in_progress"
      ? "text-emerald-700"
      : status === "cancelled"
        ? "text-red-700"
        : "text-slate-600";
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`text-[11px] font-bold capitalize ${fg}`}>{status.replace("_", " ")}</Text>
    </View>
  );
}

function EmptyRides({
  icon,
  message,
  action,
  onPress,
}: {
  icon: "search" | "add-circle";
  message: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View className="mt-16 items-center px-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-light">
        <Ionicons name={icon} size={28} color="#0F766E" />
      </View>
      <Text className="mt-4 text-center text-slate-500">{message}</Text>
      <View className="mt-5 w-48">
        <PrimaryButton label={action} onPress={onPress} />
      </View>
    </View>
  );
}

function Segment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`flex-1 rounded-full py-2.5 ${active ? "bg-brand" : ""}`}>
      <Text className={`text-center text-sm font-bold ${active ? "text-white" : "text-slate-500"}`}>{label}</Text>
    </Pressable>
  );
}

function matchesFilter(status: string, departureTime: string | null, filter: RideFilter): boolean {
  if (filter === "cancelled") {
    return status === "cancelled";
  }
  const departed = departureTime !== null && new Date(departureTime).getTime() <= Date.now();
  if (filter === "past") {
    return status !== "cancelled" && (status === "completed" || departed);
  }
  return status !== "cancelled" && status !== "completed" && !departed;
}
