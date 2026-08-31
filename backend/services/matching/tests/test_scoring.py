from services.scoring import score_match


def test_lower_detour_scores_higher() -> None:
    close = score_match(1.0, 80, 800, 1.0)
    far = score_match(10.0, 80, 800, 1.0)
    assert close > far


def test_higher_trust_scores_higher() -> None:
    high = score_match(3.0, 95, 800, 1.0)
    low = score_match(3.0, 40, 800, 1.0)
    assert high > low


def test_lower_price_scores_higher() -> None:
    cheap = score_match(3.0, 80, 500, 1.0)
    expensive = score_match(3.0, 80, 1500, 1.0)
    assert cheap > expensive
