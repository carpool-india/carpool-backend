from models.schemas import GeoPoint, MatchRequest, TripRecord
from services.google_directions import encode_polyline
from services.haversine import haversine_km
from services.route_matcher import match_trips

CHENNAI = (13.0827, 80.2707)
KRISHNAGIRI = (12.5186, 78.2137)
BANGALORE = (12.9716, 77.5946)
DELHI = (28.6139, 77.2090)
GURUGRAM = (28.4595, 77.0266)
JAIPUR = (26.9124, 75.7873)

CHENNAI_BLR_POLY = encode_polyline(
    [CHENNAI, (12.90, 79.80), (12.70, 79.20), KRISHNAGIRI, (12.70, 77.90), BANGALORE]
)
DELHI_JAIPUR_POLY = encode_polyline([DELHI, GURUGRAM, (27.90, 76.60), JAIPUR])
DATE = "2026-09-01"


def point(lat: float, lng: float) -> GeoPoint:
    return GeoPoint(lat=lat, lng=lng)


def request(
    origin: tuple[float, float],
    destination: tuple[float, float],
    seats: int = 1,
    gender: str | None = "male",
    date: str = DATE,
) -> MatchRequest:
    return MatchRequest(
        passenger_origin=point(*origin),
        passenger_destination=point(*destination),
        date=date,
        seats_needed=seats,
        passenger_gender=gender,  # type: ignore[arg-type]
    )


def trip(**overrides: object) -> TripRecord:
    base = dict(
        id="trip-1",
        driver_id="driver-1",
        origin_name="Chennai",
        origin_lat=CHENNAI[0],
        origin_lng=CHENNAI[1],
        destination_name="Bangalore",
        destination_lat=BANGALORE[0],
        destination_lng=BANGALORE[1],
        route_polyline=CHENNAI_BLR_POLY,
        departure_time=f"{DATE}T06:00:00+05:30",
        seats_total=3,
        seats_available=3,
        price_per_seat=850.0,
        status="active",
        is_women_only=False,
        trust_score=80,
        reliability=1.0,
    )
    base.update(overrides)
    return TripRecord(**base)  # type: ignore[arg-type]


def offset_north(coord: tuple[float, float], km: float) -> tuple[float, float]:
    return (coord[0] + km / 111.0, coord[1])


def test_direct_route_match() -> None:
    matches = match_trips(request(CHENNAI, BANGALORE), [trip()])
    assert len(matches) == 1
    assert matches[0].detour_km < 1.0
    assert matches[0].pickup_index < matches[0].dropoff_index


def test_intermediate_stop_3km_detour() -> None:
    origin = offset_north(KRISHNAGIRI, 3.0)
    matches = match_trips(request(origin, BANGALORE), [trip()])
    assert len(matches) == 1
    assert 2.5 < matches[0].detour_km < 4.0


def test_intermediate_stop_14_9km_just_passes() -> None:
    origin = offset_north(KRISHNAGIRI, 14.9)
    actual = haversine_km(origin[0], origin[1], KRISHNAGIRI[0], KRISHNAGIRI[1])
    assert actual <= 15.0
    matches = match_trips(request(origin, BANGALORE), [trip()])
    assert len(matches) == 1
    assert matches[0].detour_km <= 15.0


def test_intermediate_stop_15_1km_rejected() -> None:
    origin = offset_north(KRISHNAGIRI, 15.1)
    matches = match_trips(request(origin, BANGALORE), [trip()])
    assert matches == []


def test_women_only_filtered_for_male() -> None:
    matches = match_trips(
        request(CHENNAI, BANGALORE, gender="male"),
        [trip(is_women_only=True)],
    )
    assert matches == []


def test_women_only_shown_for_female() -> None:
    matches = match_trips(
        request(CHENNAI, BANGALORE, gender="female"),
        [trip(is_women_only=True)],
    )
    assert len(matches) == 1
    assert matches[0].is_women_only is True


def test_no_trips_available_on_date() -> None:
    matches = match_trips(request(CHENNAI, BANGALORE, date="2026-09-09"), [trip()])
    assert matches == []


def test_multiple_seats_filters_insufficient() -> None:
    matches = match_trips(
        request(CHENNAI, BANGALORE, seats=3),
        [trip(seats_available=2, id="low-seats"), trip(seats_available=3, id="enough")],
    )
    assert [item.trip_id for item in matches] == ["enough"]


def test_trust_score_affects_ranking() -> None:
    matches = match_trips(
        request(CHENNAI, BANGALORE),
        [
            trip(id="low-trust", trust_score=40, price_per_seat=850),
            trip(id="high-trust", trust_score=95, price_per_seat=850),
        ],
    )
    assert matches[0].trip_id == "high-trust"


def test_price_affects_ranking() -> None:
    matches = match_trips(
        request(CHENNAI, BANGALORE),
        [
            trip(id="expensive", price_per_seat=1400, trust_score=80),
            trip(id="cheap", price_per_seat=500, trust_score=80),
        ],
    )
    assert matches[0].trip_id == "cheap"


def test_departed_trip_not_shown() -> None:
    matches = match_trips(request(CHENNAI, BANGALORE), [trip(status="in_progress")])
    assert matches == []


def test_cancelled_trip_not_shown() -> None:
    matches = match_trips(request(CHENNAI, BANGALORE), [trip(status="cancelled")])
    assert matches == []


def test_wrong_direction_rejected() -> None:
    matches = match_trips(request(BANGALORE, CHENNAI), [trip()])
    assert matches == []


def test_chennai_bangalore_intermediate_krishnagiri() -> None:
    matches = match_trips(request(KRISHNAGIRI, BANGALORE), [trip()])
    assert len(matches) == 1
    assert matches[0].origin_name == "Chennai"
    assert matches[0].destination_name == "Bangalore"
    assert matches[0].pickup_index > 0
    assert matches[0].detour_km < 5


def test_delhi_jaipur_intermediate_gurugram() -> None:
    delhi_trip = trip(
        id="delhi-jaipur",
        origin_name="Delhi",
        origin_lat=DELHI[0],
        origin_lng=DELHI[1],
        destination_name="Jaipur",
        destination_lat=JAIPUR[0],
        destination_lng=JAIPUR[1],
        route_polyline=DELHI_JAIPUR_POLY,
    )
    matches = match_trips(request(GURUGRAM, JAIPUR), [delhi_trip])
    assert len(matches) == 1
    assert matches[0].origin_name == "Delhi"
    assert matches[0].pickup_index >= 0
    assert matches[0].detour_km < 5
