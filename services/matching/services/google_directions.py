from typing import Any

import httpx

GOOGLE_DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"


def encode_polyline(coords: list[tuple[float, float]]) -> str:
    def encode_value(value: float) -> str:
        int_value = int(round(value * 1e5))
        int_value = ~(int_value << 1) if int_value < 0 else (int_value << 1)
        chunks: list[str] = []
        while int_value >= 0x20:
            chunks.append(chr((0x20 | (int_value & 0x1F)) + 63))
            int_value >>= 5
        chunks.append(chr(int_value + 63))
        return "".join(chunks)

    result: list[str] = []
    prev_lat = 0.0
    prev_lng = 0.0
    for lat, lng in coords:
        result.append(encode_value(lat - prev_lat))
        result.append(encode_value(lng - prev_lng))
        prev_lat, prev_lng = lat, lng
    return "".join(result)


def decode_polyline(polyline: str) -> list[dict[str, float]]:
    index = 0
    lat = 0
    lng = 0
    coordinates: list[dict[str, float]] = []
    length = len(polyline)

    while index < length:
        for is_lat in (True, False):
            result = 0
            shift = 0
            while True:
                if index >= length:
                    raise ValueError("Truncated polyline")
                byte = ord(polyline[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else (result >> 1)
            if is_lat:
                lat += delta
            else:
                lng += delta
        coordinates.append({"lat": lat / 1e5, "lng": lng / 1e5})
    return coordinates


async def fetch_route_polyline(
    origin: dict[str, float],
    destination: dict[str, float],
    api_key: str,
) -> dict[str, Any]:
    params = {
        "origin": f"{origin['lat']},{origin['lng']}",
        "destination": f"{destination['lat']},{destination['lng']}",
        "key": api_key,
        "mode": "driving",
        "region": "in",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(GOOGLE_DIRECTIONS_URL, params=params)
        response.raise_for_status()
        payload = response.json()
    if payload.get("status") != "OK" or not payload.get("routes"):
        raise ValueError(payload.get("error_message") or payload.get("status") or "Directions failed")
    overview = payload["routes"][0]["overview_polyline"]["points"]
    return {
        "polyline": overview,
        "points": decode_polyline(overview),
        "distance_m": payload["routes"][0]["legs"][0]["distance"]["value"],
        "duration_s": payload["routes"][0]["legs"][0]["duration"]["value"],
    }
