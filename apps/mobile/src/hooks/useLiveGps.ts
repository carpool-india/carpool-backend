import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { safetyPost } from "../services/api";
import { useLocationStore } from "../store/locationStore";

const DEVIATION_CHECK_MS = 30000;

export function useLiveGps(tripId: string | null, enabled: boolean, routePolyline?: string | null) {
  const lat = useLocationStore((state) => state.lat);
  const lng = useLocationStore((state) => state.lng);
  const heading = useLocationStore((state) => state.heading);
  const speedKmph = useLocationStore((state) => state.speedKmph);

  useEffect(() => {
    if (!enabled || !tripId || lat === null || lng === null) {
      return;
    }
    const channel = supabase.channel(`trip:${tripId}`);
    const interval = setInterval(() => {
      void channel.send({
        type: "broadcast",
        event: "gps",
        payload: {
          lat,
          lng,
          tripId,
          heading,
          speedKmph,
          recordedAt: new Date().toISOString(),
        },
      });
    }, 5000);
    channel.subscribe();
    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [enabled, tripId, lat, lng, heading, speedKmph]);

  useEffect(() => {
    if (!enabled || !tripId || !routePolyline || lat === null || lng === null) {
      return;
    }
    const interval = setInterval(() => {
      safetyPost("/deviation", { tripId, lat, lng, expectedPolyline: routePolyline }).catch(() => undefined);
    }, DEVIATION_CHECK_MS);
    return () => clearInterval(interval);
  }, [enabled, tripId, routePolyline, lat, lng]);
}
