import { useRef, useState } from "react";
import { Animated, Pressable, Text } from "react-native";
import { safetyPost } from "../services/api";
import { useLocationStore } from "../store/locationStore";

export function SosButton({ tripId, bookingId }: { tripId: string; bookingId?: string }) {
  const [armed, setArmed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const lat = useLocationStore((state) => state.lat);
  const lng = useLocationStore((state) => state.lng);

  async function fire() {
    if (lat === null || lng === null) {
      return;
    }
    await safetyPost("/sos", {
      tripId,
      bookingId,
      lat,
      lng,
      holdDurationMs: 2000,
    });
    setArmed(true);
  }

  return (
    <Pressable
      onPressIn={() => {
        Animated.timing(scale, { toValue: 0.92, duration: 2000, useNativeDriver: true }).start(({ finished }) => {
          if (finished) {
            void fire();
          }
        });
      }}
      onPressOut={() => {
        scale.stopAnimation();
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      }}
      className="h-28 w-28 items-center justify-center rounded-full border-4 border-red-100 bg-sos"
    >
      <Animated.View style={{ transform: [{ scale }] }} className="items-center">
        <Text className="text-xl font-extrabold text-white">SOS</Text>
        <Text className="text-[10px] text-white">{armed ? "SENT" : "HOLD 2s"}</Text>
      </Animated.View>
    </Pressable>
  );
}
