export function encodePolyline(coords: ReadonlyArray<{ lat: number; lng: number }>): string {
  const encodeValue = (value: number): string => {
    let intValue = Math.round(value * 1e5);
    intValue = intValue < 0 ? ~(intValue << 1) : intValue << 1;
    let result = "";
    while (intValue >= 0x20) {
      result += String.fromCharCode((0x20 | (intValue & 0x1f)) + 63);
      intValue >>= 5;
    }
    result += String.fromCharCode(intValue + 63);
    return result;
  };

  let out = "";
  let prevLat = 0;
  let prevLng = 0;
  for (const point of coords) {
    out += encodeValue(point.lat - prevLat);
    out += encodeValue(point.lng - prevLng);
    prevLat = point.lat;
    prevLng = point.lng;
  }
  return out;
}

export function decodePolyline(polyline: string): Array<{ lat: number; lng: number }> {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: Array<{ lat: number; lng: number }> = [];
  const { length } = polyline;

  while (index < length) {
    for (const isLat of [true, false]) {
      let result = 0;
      let shift = 0;
      while (true) {
        if (index >= length) {
          throw new Error("Truncated polyline");
        }
        const byte = polyline.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
        if (byte < 0x20) {
          break;
        }
      }
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

export function toGeoJsonPoint(point: { lat: number; lng: number }): {
  type: "Point";
  coordinates: [number, number];
} {
  return { type: "Point", coordinates: [point.lng, point.lat] };
}

export function parseGeoPoint(
  value: unknown
): { lat: number; lng: number } | null {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value !== null && "lat" in value && "lng" in value) {
    const record = value as { lat: number; lng: number };
    return { lat: Number(record.lat), lng: Number(record.lng) };
  }
  if (typeof value === "object" && value !== null && "coordinates" in value) {
    const coords = (value as { coordinates: number[] }).coordinates;
    return { lng: Number(coords[0]), lat: Number(coords[1]) };
  }
  if (typeof value === "string") {
    const match = value.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (!match) {
      return null;
    }
    return { lng: Number(match[1]), lat: Number(match[2]) };
  }
  return null;
}
