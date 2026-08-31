import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BookingStatus } from "@rideshare/types";
import { paymentGet } from "../../services/api";
import { useTripStore } from "../../store/tripStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";

export function BookingConfirmScreen({
  route,
  navigation,
}: {
  route: { params: { bookingId: string } };
  navigation: { navigate: (name: string) => void };
}) {
  const language = useAuthStore((state) => state.language);
  const booking = useTripStore((state) => state.activeBooking);
  const setActiveBooking = useTripStore((state) => state.setActiveBooking);
  const [status, setStatus] = useState<BookingStatus>(booking?.status ?? "pending");

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const result = await paymentGet<{ status: string }>(`/status?bookingId=${route.params.bookingId}`);
      if (cancelled) {
        return;
      }
      if (result.status === "captured") {
        setStatus("confirmed");
        if (booking) {
          setActiveBooking({ ...booking, status: "confirmed" });
        }
      }
    }
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [booking, route.params.bookingId, setActiveBooking]);

  const paid = status === "confirmed";

  return (
    <Screen variant="stacked">
      <View className="items-center px-6 pt-10">
      <View
        className={`h-24 w-24 items-center justify-center rounded-full ${paid ? "bg-brand" : "bg-amber-100"}`}
      >
        <Ionicons name={paid ? "checkmark" : "hourglass"} size={40} color={paid ? "#FFFFFF" : "#D97706"} />
      </View>
      <Text className="mt-6 text-center text-3xl font-extrabold text-slate-900">
        {paid ? t(language, "paymentOk") : t(language, "waitingUpi")}
      </Text>
      <Text className="mt-3 text-center text-base leading-6 text-slate-500">
        {paid
          ? "WhatsApp confirmation has been sent."
          : "Complete the UPI payment. This screen checks Razorpay every few seconds."}
      </Text>
      <View className="mt-8 w-full">
        <PrimaryButton disabled={!paid} label="Open live trip" onPress={() => navigation.navigate("ActiveTrip")} />
      </View>
      </View>
    </Screen>
  );
}
