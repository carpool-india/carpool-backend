import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLocationStore } from "../store/locationStore";

export interface LiveGpsPoint {
  lat: number;
  lng: number;
  tripId: string;
  heading?: number;
  speedKmph?: number;
  recordedAt: string;
}

export function useRealtimeTrip(tripId: string | null) {
  const [driverGps, setDriverGps] = useState<LiveGpsPoint | null>(null);

  useEffect(() => {
    if (!tripId) {
      return;
    }
    const channel = supabase.channel(`trip:${tripId}`);
    channel.on("broadcast", { event: "gps" }, (payload) => {
      const data = payload.payload as LiveGpsPoint;
      setDriverGps(data);
      useLocationStore.getState().setCoords(data.lat, data.lng, data.heading, data.speedKmph);
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { driverGps };
}
