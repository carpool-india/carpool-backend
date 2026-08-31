import { decodePolyline, isOffRoute } from "../services/deviation.service";

function encodePolyline(coords: Array<[number, number]>): string {
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
  for (const [lat, lng] of coords) {
    out += encodeValue(lat - prevLat);
    out += encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return out;
}

const CHENNAI_BLR = encodePolyline([
  [13.0827, 80.2707],
  [12.5186, 78.2137],
  [12.9716, 77.5946],
]);

describe("route deviation", () => {
  it("round-trips encoded polylines", () => {
    const points = decodePolyline(CHENNAI_BLR);
    expect(points[0].lat).toBeCloseTo(13.0827, 3);
  });

  it("treats Krishnagiri as on the Chennai-Bangalore route", () => {
    const result = isOffRoute({ lat: 12.5186, lng: 78.2137 }, CHENNAI_BLR, 2);
    expect(result.offRoute).toBe(false);
  });

  it("flags a GPS point far from the polyline", () => {
    const result = isOffRoute({ lat: 19.076, lng: 72.8777 }, CHENNAI_BLR, 2);
    expect(result.offRoute).toBe(true);
    expect(result.distanceKm).toBeGreaterThan(50);
  });
});
