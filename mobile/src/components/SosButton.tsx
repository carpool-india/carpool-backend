import { useRef, useState } from "react";
import { Animated, Linking, Pressable, Text } from "react-native";
import * as Location from "expo-location";
import { safetyPost } from "../services/api";
import { useLocationStore } from "../store/locationStore";

type SosState = "idle" | "sending" | "sent" | "failed";

async function resolveCoords(): Promise<{ lat: number; lng: number } | null> {
  const stored = useLocationStore.getState();
  if (stored.lat !== null && stored.lng !== null) {
    return { lat: stored.lat, lng: stored.lng };
  }
  // Live GPS may not have produced a fix yet (cold start, indoor signal) — a
  // real emergency shouldn't be blocked on that, so try one direct read before
  // giving up on sending a location at all.
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: current.coords.latitude, lng: current.coords.longitude };
  } catch {
    return null;
  }
}

async function postSosWithRetries(payload: Record<string, unknown>): Promise<void> {
  const attempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await safetyPost("/sos", payload);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError;
}

export function SosButton({ tripId, bookingId }: { tripId: string; bookingId?: string }) {
  const [state, setState] = useState<SosState>("idle");
  const scale = useRef(new Animated.Value(1)).current;

  async function fire() {
    setState("sending");
    const coords = await resolveCoords();
    try {
      // Send null rather than fabricating 0,0 when there's truly no fix — that's
      // a real point in the Gulf of Guinea, and dispatching it to emergency
      // contacts/admins as this user's location would be actively misleading.
      await postSosWithRetries({
        tripId,
        bookingId,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        holdDurationMs: 2000,
      });
      setState("sent");
    } catch (error) {
      console.warn("SOS dispatch failed after retries", error);
      setState("failed");
    }
  }

  const label = { idle: "HOLD 2s", sending: "SENDING…", sent: "SENT", failed: "FAILED — TAP TO CALL 112" }[state];

  return (
    <Pressable
      onPressIn={() => {
        if (state === "sending" || state === "sent") return;
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
      onPress={() => {
        // The in-app alert path failed after retries (no network, backend
        // down) — the one channel that still reliably reaches police in India
        // is dialing them directly, so surface that immediately as a tap.
        if (state === "failed") {
          void Linking.openURL("tel:112");
        }
      }}
      className="h-28 w-28 items-center justify-center rounded-full border-4 border-red-100 bg-sos"
    >
      <Animated.View style={{ transform: [{ scale }] }} className="items-center">
        <Text className="text-xl font-extrabold text-white">SOS</Text>
        <Text className="text-[10px] text-white text-center px-2">{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
