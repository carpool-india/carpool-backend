import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SERVICE_FEE_RATE, type Booking, type PriceBreakdown, type Subscription } from "@rideshare/types";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { PriceBreakdownView } from "../../components/PriceBreakdown";
import { bookingPost, paymentGet, paymentPost } from "../../services/api";
import { openUpiCheckout } from "../../services/razorpay";
import { navigateRoot } from "../../navigation/navigateRoot";
import { useTripStore } from "../../store/tripStore";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";

export function BookingScreen({
  route,
  navigation,
}: {
  route: { params: { tripId: string } };
  navigation: { navigate: (name: string, params: { bookingId: string }) => void };
}) {
  const match = useTripStore(
    (state) => state.selectedMatch ?? state.matches.find((item) => item.id === route.params.tripId)
  );
  const setActiveBooking = useTripStore((state) => state.setActiveBooking);
  const setActiveTrip = useTripStore((state) => state.setActiveTrip);
  const language = useAuthStore((state) => state.language);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [feeWaived, setFeeWaived] = useState(false);

  useFocusEffect(
    useCallback(() => {
      paymentGet<{ subscriptions: Subscription[] }>("/subscriptions/me")
        .then((payload) =>
          setFeeWaived(
            payload.subscriptions.some(
              (item) =>
                item.planType === "passenger" &&
                item.status === "active" &&
                item.expiresAt &&
                new Date(item.expiresAt).getTime() > Date.now()
            )
          )
        )
        .catch(() => setFeeWaived(false));
    }, [])
  );

  if (!match) {
    return <Text>Trip missing</Text>;
  }
  const trip = match;
  const seatsBooked = 1;
  const subtotal = trip.pricePerSeat * seatsBooked;
  const serviceFee = feeWaived ? 0 : Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  // totalAmount is what's charged via the app (platform fee only) — the fare
  // (subtotal) is paid directly to the driver via UPI/cash.
  const breakdown: PriceBreakdown = {
    seatFare: trip.pricePerSeat,
    seatsBooked,
    subtotal,
    serviceFee,
    totalAmount: serviceFee,
    feeWaived,
    currency: "INR",
  };

  async function pay() {
    setPaying(true);
    try {
      const created = await bookingPost<{ booking: Booking; breakdown: PriceBreakdown }>("/bookings", {
        tripId: trip.id,
        seatsBooked,
        pickupPoint: trip.pickupPoint,
        dropoffPoint: trip.dropoffPoint,
      });
      const order = await paymentPost<{ orderId: string | null; amountPaise: number; alreadyConfirmed: boolean }>(
        "/order",
        { bookingId: created.booking.id }
      );
      if (order.alreadyConfirmed || !order.orderId) {
        setActiveBooking({ ...created.booking, status: "confirmed" });
        setActiveTrip(trip);
        navigation.navigate("BookingConfirm", { bookingId: created.booking.id });
        return;
      }
      await openUpiCheckout(order.orderId, order.amountPaise / 100);
      const status = await paymentGet<{ status: string }>(`/status?bookingId=${created.booking.id}`);
      if (status.status !== "captured") {
        setActiveBooking(created.booking);
        setActiveTrip(trip);
        navigation.navigate("BookingConfirm", { bookingId: created.booking.id });
        return;
      }
      setActiveBooking({ ...created.booking, status: "confirmed" });
      setActiveTrip(trip);
      navigation.navigate("BookingConfirm", { bookingId: created.booking.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  return (
    <Screen variant="stacked" scroll>
      <View className="px-4 pt-4">
      <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {trip.originName} → {trip.destinationName}
      </Text>
      <Text className="mb-4 text-2xl font-extrabold text-slate-900">Confirm booking</Text>
      <PriceBreakdownView breakdown={breakdown} />
      {!feeWaived ? (
        <Text
          className="mt-2 text-center text-xs font-semibold text-brand"
          onPress={() => navigateRoot(navigation, "Plans")}
        >
          {t(language, "planUpsellHint")}
        </Text>
      ) : null}
      {error ? <Text className="mt-3 text-sos">{error}</Text> : null}
      <View className="mt-6">
        <PrimaryButton
          disabled={paying}
          loading={paying}
          label={t(language, "payUpi")}
          onPress={() => void pay()}
        />
      </View>
      </View>
    </Screen>
  );
}
