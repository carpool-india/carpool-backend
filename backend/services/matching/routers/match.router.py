import os
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException

from models.schemas import GeoPoint, IntermediateStopRequest, IntermediateStopResult, MatchRequest, TripRecord
from services.google_directions import decode_polyline, encode_polyline, fetch_route_polyline
from services.haversine import haversine_km, nearest_index
from services.route_matcher import MAX_DETOUR_KM, match_trips

router = APIRouter()


def _parse_point(raw: object) -> tuple[float, float]:
    if isinstance(raw, str):
        start = raw.find("(")
        end = raw.find(")")
        lng_str, lat_str = raw[start + 1 : end].split()
        return float(lat_str), float(lng_str)
    if isinstance(raw, dict):
        if "coordinates" in raw:
            lng, lat = raw["coordinates"]
            return float(lat), float(lng)
        return float(raw["lat"]), float(raw["lng"])
    raise ValueError("Unsupported geometry payload")


def _supabase_headers() -> dict[str, str]:
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_ANON_KEY"]
    return {"apikey": key, "Authorization": f"Bearer {key}"}


async def fetch_active_trips(date: str, seats_needed: int) -> list[TripRecord]:
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/trips"
    headers = _supabase_headers()
    start = f"{date}T00:00:00"
    end = f"{date}T23:59:59"
    params = {
        "select": "id,driver_id,origin_name,origin_point,destination_name,destination_point,route_polyline,departure_time,seats_total,seats_available,price_per_seat,status,is_women_only,trip_type,instant_book,users!trips_driver_id_fkey(id,name,photo_url,trust_score,average_stars,rating_count,gender,aadhaar_verified,dl_verified),driver_profiles(reliability_score),vehicles(vehicle_type,registration_number)",
        "status": "eq.active",
        "seats_available": f"gte.{seats_needed}",
        "departure_time": f"gte.{start}",
        "and": f"(departure_time.lte.{end})",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, headers=headers, params=params)
        if response.status_code >= 400:
            simple_params = {
                "select": "*",
                "status": "eq.active",
                "seats_available": f"gte.{seats_needed}",
                "departure_time": f"gte.{start}",
            }
            response = await client.get(url, headers=headers, params=simple_params)
        response.raise_for_status()
        rows = response.json()

    trips: list[TripRecord] = []
    for row in rows:
        if not str(row.get("departure_time", "")).startswith(date):
            continue
        origin_lat, origin_lng = _parse_point(row["origin_point"]) if row.get("origin_point") else (0.0, 0.0)
        dest_lat, dest_lng = _parse_point(row["destination_point"]) if row.get("destination_point") else (0.0, 0.0)
        user = row.get("users") or {}
        if isinstance(user, list):
            user = user[0] if user else {}
        profile = row.get("driver_profiles") or {}
        reliability = 1.0
        if isinstance(profile, list) and profile:
            reliability = float(profile[0].get("reliability_score") or 1.0)
        elif isinstance(profile, dict):
            reliability = float(profile.get("reliability_score") or 1.0)
        vehicle = row.get("vehicles") or {}
        if isinstance(vehicle, list):
            vehicle = vehicle[0] if vehicle else {}
        vehicle_type = vehicle.get("vehicle_type") if isinstance(vehicle, dict) else None
        vehicle_registration = vehicle.get("registration_number") if isinstance(vehicle, dict) else None
        driver = None
        if user:
            gender = user.get("gender")
            if gender not in ("male", "female", "other"):
                gender = None
            driver = {
                "id": str(user.get("id") or row["driver_id"]),
                "name": user.get("name"),
                "photo_url": user.get("photo_url"),
                "trust_score": int(user.get("trust_score") or 0),
                "average_stars": float(user.get("average_stars") or 0),
                "rating_count": int(user.get("rating_count") or 0),
                "gender": gender,
                "aadhaar_verified": bool(user.get("aadhaar_verified")),
                "dl_verified": bool(user.get("dl_verified")),
            }
        trips.append(
            TripRecord(
                id=row["id"],
                driver_id=row["driver_id"],
                origin_name=row["origin_name"],
                origin_lat=origin_lat,
                origin_lng=origin_lng,
                destination_name=row["destination_name"],
                destination_lat=dest_lat,
                destination_lng=dest_lng,
                route_polyline=row.get("route_polyline") or "",
                departure_time=row["departure_time"],
                seats_total=row["seats_total"],
                seats_available=row["seats_available"],
                price_per_seat=float(row["price_per_seat"]),
                status=row["status"],
                is_women_only=bool(row.get("is_women_only")),
                trust_score=int((user or {}).get("trust_score") or 0),
                reliability=reliability,
                trip_type=row.get("trip_type") or "intracity",
                instant_book=bool(row.get("instant_book", True)),
                driver=driver,
                vehicle_type=vehicle_type,
                vehicle_registration=vehicle_registration,
            )
        )
    return trips


async def ensure_route_polylines(trips: list[TripRecord]) -> list[TripRecord]:
    missing = [trip for trip in trips if not trip.route_polyline]
    if not missing:
        return trips
    key = (os.environ.get("GOOGLE_MAPS_API_KEY") or "").strip()
    filled: dict[str, str] = {}
    for trip in missing[:8]:
        polyline = ""
        if key:
            try:
                data = await fetch_route_polyline(
                    {"lat": trip.origin_lat, "lng": trip.origin_lng},
                    {"lat": trip.destination_lat, "lng": trip.destination_lng},
                    key,
                )
                polyline = str(data["polyline"])
            except Exception:
                polyline = ""
        if not polyline:
            polyline = encode_polyline(
                [(trip.origin_lat, trip.origin_lng), (trip.destination_lat, trip.destination_lng)]
            )
        filled[trip.id] = polyline
    return [
        trip.model_copy(update={"route_polyline": filled[trip.id]}) if trip.id in filled else trip
        for trip in trips
    ]


@router.post("/match")
async def match(request: MatchRequest):
    try:
        datetime.strptime(request.date, "%Y-%m-%d")
        trips = await fetch_active_trips(request.date, request.seats_needed)
        trips = await ensure_route_polylines(trips)
        return {"matches": [item.model_dump() for item in match_trips(request, trips)]}
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Supabase query failed: {exc}") from exc


@router.post("/intermediate-stops")
async def intermediate_stops(request: IntermediateStopRequest):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/trips"
    headers = _supabase_headers()
    params = {"id": f"eq.{request.trip_id}", "select": "id,route_polyline"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        rows = response.json()
    if not rows or not rows[0].get("route_polyline"):
        raise HTTPException(status_code=404, detail="Trip polyline not found")
    points = decode_polyline(rows[0]["route_polyline"])
    index = nearest_index(points, request.stop_point.lat, request.stop_point.lng)
    snapped = points[index]
    offset = haversine_km(
        request.stop_point.lat, request.stop_point.lng, snapped["lat"], snapped["lng"]
    )
    accepted = offset <= MAX_DETOUR_KM
    result = IntermediateStopResult(
        trip_id=request.trip_id,
        stop_name=request.stop_name,
        snapped_point=GeoPoint(lat=snapped["lat"], lng=snapped["lng"]),
        index=index,
        offset_km=round(offset, 3),
        accepted=accepted,
        reason="within 15km of route" if accepted else "stop is more than 15km off the driver route",
    )
    return result.model_dump()
