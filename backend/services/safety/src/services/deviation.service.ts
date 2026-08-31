import { haversineKm } from "@rideshare/utils";

export interface PolylinePoint {
  lat: number;
  lng: number;
}

export function decodePolyline(encoded: string): PolylinePoint[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: PolylinePoint[] = [];
  while (index < encoded.length) {
    for (const isLat of [true, false]) {
      let result = 0;
      let shift = 0;
      let byte = 0;
      do {
        byte = encoded.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (isLat) {
        lat += delta;
      } else {
        lng += delta;
      }
    }
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
}

export function distanceToPolylineKm(point: PolylinePoint, polyline: PolylinePoint[]): number {
  if (polyline.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  let min = Number.POSITIVE_INFINITY;
  for (const candidate of polyline) {
    min = Math.min(min, haversineKm(point.lat, point.lng, candidate.lat, candidate.lng));
  }
  return min;
}

export function isOffRoute(
  point: PolylinePoint,
  encodedPolyline: string,
  thresholdKm = 2
): { offRoute: boolean; distanceKm: number } {
  const distanceKm = distanceToPolylineKm(point, decodePolyline(encodedPolyline));
  return { offRoute: distanceKm > thresholdKm, distanceKm };
}
