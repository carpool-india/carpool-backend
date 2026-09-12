import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface LiveGpsPoint {
  lat: number;
  lng: number;
  tripId: string;
  heading?: number;
  speedKmph?: number;
  recordedAt: string;
}

// Mirrors mobile's useRealtimeTrip: the driver app broadcasts a "gps" event on
// the trip:{tripId} Supabase Realtime channel every 5s (see mobile's
// useLiveGps.ts). Web only ever consumes this channel, it never broadcasts.
export function useRealtimeTrip(tripId: string | null) {
  const [driverGps, setDriverGps] = useState<LiveGpsPoint | null>(null);

  useEffect(() => {
    setDriverGps(null);
    if (!tripId) {
      return;
    }
    const channel = supabase.channel(`trip:${tripId}`);
    channel.on("broadcast", { event: "gps" }, (payload) => {
      setDriverGps(payload.payload as LiveGpsPoint);
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { driverGps };
}
