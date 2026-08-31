import { encodePolyline } from "@rideshare/utils";
import { loadEnv } from "../lib/env";

export async function resolveRoutePolyline(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  existing?: string
): Promise<string> {
  if (existing && existing.length >= 8) {
    return existing;
  }
  const env = loadEnv();
  if (env.GOOGLE_MAPS_API_KEY) {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: env.GOOGLE_MAPS_API_KEY,
      mode: "driving",
      region: "in",
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`);
    if (response.ok) {
      const payload = (await response.json()) as {
        status?: string;
        routes?: Array<{ overview_polyline?: { points?: string } }>;
      };
      const points = payload.routes?.[0]?.overview_polyline?.points;
      if (payload.status === "OK" && points) {
        return points;
      }
    }
  }
  return encodePolyline([origin, destination]);
}
