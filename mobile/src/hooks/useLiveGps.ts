import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { safetyPost } from "../services/api";
import { useLocationStore } from "../store/locationStore";

const DEVIATION_CHECK_MS = 30000;

export function useLiveGps(tripId: string | null, enabled: boolean, routePolyline?: string | null) {
  const lat = useLocationStore((state) => state.lat);
  const lng = useLocationStore((state) => state.lng);
  const heading = useLocationStore((state) => state.heading);
  const speedKmph = useLocationStore((state) => state.speedKmph);

  // Position updates every ~5s from useLocation's GPS watch. Read the latest
  // value from a ref inside the intervals below instead of depending on
  // lat/lng directly -- otherwise both effects tear down and recreate their
  // subscription/interval on every single position tick, which (a) resubscribes
  // the realtime channel over the network every 5s all trip long, and (b) resets
  // the 30s deviation-check interval before it ever reaches 30s, so it never fires.
  const positionRef = useRef({ lat, lng, heading, speedKmph });
  positionRef.current = { lat, lng, heading, speedKmph };

  useEffect(() => {
    if (!enabled || !tripId) {
      return;
    }
    const channel = supabase.channel(`trip:${tripId}`);
    const interval = setInterval(() => {
      const pos = positionRef.current;
      if (pos.lat === null || pos.lng === null) {
        return;
      }
      void channel.send({
        type: "broadcast",
        event: "gps",
        payload: {
          lat: pos.lat,
          lng: pos.lng,
          tripId,
          heading: pos.heading,
          speedKmph: pos.speedKmph,
          recordedAt: new Date().toISOString(),
        },
      });
    }, 5000);
    channel.subscribe();
    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [enabled, tripId]);

  useEffect(() => {
    if (!enabled || !tripId || !routePolyline) {
      return;
    }
    const interval = setInterval(() => {
      const pos = positionRef.current;
      if (pos.lat === null || pos.lng === null) {
        return;
      }
      safetyPost("/deviation", { tripId, lat: pos.lat, lng: pos.lng, expectedPolyline: routePolyline }).catch(
        () => undefined
      );
    }, DEVIATION_CHECK_MS);
    return () => clearInterval(interval);
  }, [enabled, tripId, routePolyline]);
}
