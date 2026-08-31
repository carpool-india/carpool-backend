from models.schemas import GeoPoint, MatchRequest, MatchResult, TripRecord
from services.google_directions import decode_polyline
from services.haversine import nearest_index
from services.scoring import detour_km, score_match

MAX_DETOUR_KM = 15.0
MAX_RESULTS = 20


def match_trips(request: MatchRequest, trips: list[TripRecord]) -> list[MatchResult]:
    results: list[MatchResult] = []
    origin = {"lat": request.passenger_origin.lat, "lng": request.passenger_origin.lng}
    destination = {
        "lat": request.passenger_destination.lat,
        "lng": request.passenger_destination.lng,
    }

    for trip in trips:
        if trip.status != "active":
            continue
        if not trip.departure_time.startswith(request.date):
            continue
        if trip.seats_available < request.seats_needed:
            continue
        if trip.is_women_only and request.passenger_gender != "female":
            continue
        if request.trip_type and trip.trip_type != request.trip_type:
            continue
        if request.instant_book_only and not trip.instant_book:
            continue
        if request.max_price_per_seat is not None and trip.price_per_seat > request.max_price_per_seat:
            continue
        if not trip.route_polyline:
            continue

        points = decode_polyline(trip.route_polyline)
        pickup_index = nearest_index(points, origin["lat"], origin["lng"])
        dropoff_index = nearest_index(points, destination["lat"], destination["lng"])
        if pickup_index >= dropoff_index:
            continue

        pickup_point = points[pickup_index]
        dropoff_point = points[dropoff_index]
        extra_km = detour_km(origin, pickup_point, destination, dropoff_point)
        if extra_km > MAX_DETOUR_KM:
            continue

        score = score_match(
            extra_km, trip.trust_score, trip.price_per_seat, trip.reliability
        )
        results.append(
            MatchResult(
                trip_id=trip.id,
                driver_id=trip.driver_id,
                origin_name=trip.origin_name,
                destination_name=trip.destination_name,
                departure_time=trip.departure_time,
                seats_available=trip.seats_available,
                price_per_seat=trip.price_per_seat,
                trust_score=trip.trust_score,
                reliability=trip.reliability,
                pickup_point=GeoPoint(lat=pickup_point["lat"], lng=pickup_point["lng"]),
                dropoff_point=GeoPoint(lat=dropoff_point["lat"], lng=dropoff_point["lng"]),
                pickup_index=pickup_index,
                dropoff_index=dropoff_index,
                detour_km=round(extra_km, 3),
                score=round(score, 6),
                is_women_only=trip.is_women_only,
                trip_type=trip.trip_type,
                instant_book=trip.instant_book,
                vehicle_type=trip.vehicle_type,
                vehicle_registration=trip.vehicle_registration,
                driver=trip.driver,
                route_polyline=trip.route_polyline or None,
            )
        )

    results.sort(key=lambda item: item.score, reverse=True)
    return results[:MAX_RESULTS]
