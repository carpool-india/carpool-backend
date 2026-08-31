from services.haversine import haversine_km


def score_match(detour_km: float, trust_score: int, price_per_seat: float, reliability: float) -> float:
    price = max(price_per_seat, 1.0)
    reliability_clamped = min(max(reliability, 0.0), 1.0)
    return (
        (0.4 / (detour_km + 0.1))
        + (trust_score / 100.0 * 0.3)
        + (1.0 / price * 0.2)
        + (reliability_clamped * 0.1)
    )


def detour_km(
    passenger_origin: dict[str, float],
    pickup_point: dict[str, float],
    passenger_destination: dict[str, float],
    dropoff_point: dict[str, float],
) -> float:
    return haversine_km(
        passenger_origin["lat"],
        passenger_origin["lng"],
        pickup_point["lat"],
        pickup_point["lng"],
    ) + haversine_km(
        passenger_destination["lat"],
        passenger_destination["lng"],
        dropoff_point["lat"],
        dropoff_point["lng"],
    )
