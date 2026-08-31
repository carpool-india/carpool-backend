import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { safetyPost } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useTripStore } from "../../store/tripStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";

export function RateTripScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  const booking = useTripStore((state) => state.activeBooking);
  const trip = useTripStore((state) => state.activeTrip);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const isDriver = Boolean(trip && currentUserId && trip.driverId === currentUserId);
  const rateeId = isDriver ? booking?.passengerId : trip?.driverId;

  async function submit() {
    if (!booking || !trip || !rateeId || !currentUserId || rateeId === currentUserId) {
      navigation.navigate("Main");
      return;
    }
    await safetyPost("/ratings", {
      bookingId: booking.id,
      rateeId,
      stars,
      comment,
      tags: stars >= 5 ? ["safe", "on_time"] : ["needs_improvement"],
    });
    navigation.navigate("Main");
  }

  return (
    <Screen variant="stacked" scroll>
      <View className="px-5 pt-6">
      <Text className="text-3xl font-extrabold text-slate-900">
        {isDriver ? "How was your passenger?" : "How was your ride?"}
      </Text>
      <Text className="mt-2 text-slate-500">Your rating builds trust for the next {isDriver ? "rider" : "passenger"}.</Text>
      <View className="mt-8 flex-row justify-center gap-3">
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setStars(value)} className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <Text className={`text-3xl ${value <= stars ? "text-amber-400" : "text-slate-200"}`}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="How was the ride?"
        placeholderTextColor="#94A3B8"
        multiline
        className="mt-6 min-h-[100px] rounded-[24px] bg-white px-4 py-4 text-base"
      />
      <View className="mt-6">
        <PrimaryButton label="Submit rating" disabled={!rateeId} onPress={() => void submit()} />
      </View>
      </View>
    </Screen>
  );
}
