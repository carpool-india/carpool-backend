from pydantic import BaseModel, Field
from typing import Literal, Optional


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class MatchRequest(BaseModel):
    passenger_origin: GeoPoint
    passenger_destination: GeoPoint
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    seats_needed: int = Field(..., ge=1, le=4)
    passenger_gender: Optional[Literal["male", "female", "other"]] = None
    trip_type: Optional[Literal["intracity", "intercity"]] = None
    instant_book_only: bool = False
    max_price_per_seat: Optional[float] = None


class DriverInfo(BaseModel):
    id: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    trust_score: int = 0
    average_stars: float = 0
    rating_count: int = 0
    gender: Optional[Literal["male", "female", "other"]] = None
    aadhaar_verified: bool = False
    dl_verified: bool = False


class TripRecord(BaseModel):
    id: str
    driver_id: str
    origin_name: str
    origin_lat: float
    origin_lng: float
    destination_name: str
    destination_lat: float
    destination_lng: float
    route_polyline: str
    departure_time: str
    seats_total: int
    seats_available: int
    price_per_seat: float
    status: Literal["active", "in_progress", "completed", "cancelled"]
    is_women_only: bool = False
    trust_score: int = 0
    reliability: float = 1.0
    trip_type: Literal["intracity", "intercity"] = "intracity"
    instant_book: bool = True
    driver: Optional[DriverInfo] = None
    vehicle_type: Optional[Literal["car", "bike"]] = None
    vehicle_registration: Optional[str] = None


class MatchResult(BaseModel):
    trip_id: str
    driver_id: str
    origin_name: str
    destination_name: str
    departure_time: str
    seats_available: int
    price_per_seat: float
    trust_score: int
    reliability: float
    pickup_point: GeoPoint
    dropoff_point: GeoPoint
    pickup_index: int
    dropoff_index: int
    detour_km: float
    score: float
    is_women_only: bool
    trip_type: Literal["intracity", "intercity"]
    instant_book: bool = True
    vehicle_type: Optional[Literal["car", "bike"]] = None
    vehicle_registration: Optional[str] = None
    driver: Optional[DriverInfo] = None
    route_polyline: Optional[str] = None


class IntermediateStopRequest(BaseModel):
    trip_id: str
    stop_point: GeoPoint
    stop_name: str


class IntermediateStopResult(BaseModel):
    trip_id: str
    stop_name: str
    snapped_point: GeoPoint
    index: int
    offset_km: float
    accepted: bool
    reason: str
