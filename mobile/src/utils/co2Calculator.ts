const CO2_PER_CAR_KM = 0.12;
const CO2_PER_SHARED_SEAT_KM = 0.04;

export function kgCo2Saved(distanceKm: number, seatsOccupied: number): number {
  const solo = CO2_PER_CAR_KM * distanceKm * Math.max(seatsOccupied, 1);
  const shared = CO2_PER_CAR_KM * distanceKm + CO2_PER_SHARED_SEAT_KM * distanceKm * Math.max(seatsOccupied - 1, 0);
  return Math.max(0, Number((solo - shared).toFixed(2)));
}
