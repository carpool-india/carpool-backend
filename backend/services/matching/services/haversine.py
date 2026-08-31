from math import atan2, cos, radians, sin, sqrt

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    )
    return EARTH_RADIUS_KM * 2 * atan2(sqrt(a), sqrt(1 - a))


def nearest_index(points: list[dict[str, float]], target_lat: float, target_lng: float) -> int:
    if not points:
        raise ValueError("Cannot snap to an empty polyline")
    best_i = 0
    best_d = float("inf")
    for i, point in enumerate(points):
        distance = haversine_km(point["lat"], point["lng"], target_lat, target_lng)
        if distance < best_d:
            best_d = distance
            best_i = i
    return best_i


def path_length_km(points: list[dict[str, float]], start: int = 0, end: int | None = None) -> float:
    last = len(points) - 1 if end is None else end
    total = 0.0
    for i in range(start + 1, last + 1):
        total += haversine_km(
            points[i - 1]["lat"], points[i - 1]["lng"], points[i]["lat"], points[i]["lng"]
        )
    return total
