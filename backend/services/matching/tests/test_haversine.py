from services.haversine import haversine_km


def test_haversine_chennai_bangalore_is_about_290km() -> None:
    distance = haversine_km(13.0827, 80.2707, 12.9716, 77.5946)
    assert 280 < distance < 340


def test_haversine_same_point_is_zero() -> None:
    assert haversine_km(28.6139, 77.2090, 28.6139, 77.2090) == 0
