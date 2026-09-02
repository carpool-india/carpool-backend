import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TripType } from "@rideshare/types";
import { matchingPost } from "../services/api";
import { PlaceInput } from "../components/PlaceInput";
import { RideCard } from "../components/RideCard";
import { useAuthStore } from "../store/authStore";
import { useTripStore, type SearchMatch } from "../store/tripStore";
import type { MapPlace } from "../services/places";

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatDateDisplay(value: Date): string {
  return value.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

interface MatchPayload {
  matches: Array<{
    trip_id: string;
    driver_id: string;
    origin_name: string;
    destination_name: string;
    departure_time: string;
    seats_available: number;
    price_per_seat: number;
    trust_score: number;
    pickup_point: { lat: number; lng: number };
    dropoff_point: { lat: number; lng: number };
    detour_km: number;
    score: number;
    is_women_only: boolean;
    trip_type: TripType;
    instant_book: boolean;
    vehicle_type?: "car" | "bike" | null;
    vehicle_registration?: string | null;
    driver?: { name?: string | null; photo_url?: string | null; average_stars?: number; rating_count?: number };
    route_polyline?: string | null;
  }>;
}

export function SearchPage() {
  const user = useAuthStore((state) => state.user);
  const matches = useTripStore((state) => state.matches);
  const setMatches = useTripStore((state) => state.setMatches);
  const setSelectedMatch = useTripStore((state) => state.setSelectedMatch);
  const searchNote = useTripStore((state) => state.searchNote);
  const setSearchNote = useTripStore((state) => state.setSearchNote);
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = location.state as { origin?: MapPlace; destination?: MapPlace; date?: string; seats?: number } | null;

  const [origin, setOrigin] = useState<MapPlace | null>(incoming?.origin ?? null);
  const [destination, setDestination] = useState<MapPlace | null>(incoming?.destination ?? null);
  const [date, setDate] = useState(incoming?.date ?? toDateKey(new Date()));
  const [seats, setSeats] = useState(incoming?.seats ?? 1);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function fetchMatches(searchDate: string, originPlace: MapPlace, destinationPlace: MapPlace): Promise<SearchMatch[]> {
    const payload = await matchingPost<MatchPayload>("/match", {
      passenger_origin: { lat: originPlace.lat, lng: originPlace.lng },
      passenger_destination: { lat: destinationPlace.lat, lng: destinationPlace.lng },
      date: searchDate,
      seats_needed: seats,
      passenger_gender: user?.gender,
    });
    return payload.matches.map((match) => ({
      id: match.trip_id,
      driverId: match.driver_id,
      originName: match.origin_name,
      originPoint: match.pickup_point,
      destinationName: match.destination_name,
      destinationPoint: match.dropoff_point,
      routePolyline: match.route_polyline ?? null,
      departureTime: match.departure_time,
      seatsTotal: match.seats_available,
      seatsAvailable: match.seats_available,
      pricePerSeat: match.price_per_seat,
      status: "active",
      isWomenOnly: match.is_women_only,
      luggagePolicy: "small",
      tripType: match.trip_type,
      instantBook: match.instant_book,
      vehicleType: match.vehicle_type ?? null,
      vehicleRegistration: match.vehicle_registration ?? null,
      cancellationBondPaid: true,
      createdAt: new Date().toISOString(),
      trustScore: match.trust_score,
      averageStars: match.driver?.average_stars ?? 0,
      ratingCount: match.driver?.rating_count ?? 0,
      driverName: match.driver?.name ?? "Verified driver",
      driverPhotoUrl: match.driver?.photo_url ?? null,
      pickupPoint: match.pickup_point,
      dropoffPoint: match.dropoff_point,
      detourKm: match.detour_km,
      score: match.score,
    }));
  }

  async function search() {
    if (!origin || !destination) {
      setError("Choose both a from and to location");
      return;
    }
    setSearching(true);
    setError(null);
    setSearched(true);
    try {
      let results = await fetchMatches(date, origin, destination);
      if (results.length === 0) {
        const requested = new Date(`${date}T00:00:00`);
        const dayBefore = new Date(requested);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(requested);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const [before, after] = await Promise.all([
          dayBefore.getTime() >= new Date().setHours(0, 0, 0, 0)
            ? fetchMatches(toDateKey(dayBefore), origin, destination).catch(() => [])
            : Promise.resolve([]),
          fetchMatches(toDateKey(dayAfter), origin, destination).catch(() => []),
        ]);
        results = [...before, ...after];
        setSearchNote(results.length > 0 ? `No rides on ${formatDateDisplay(requested)} — showing nearby dates instead` : null);
      } else {
        setSearchNote(null);
      }
      setMatches(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (incoming?.origin && incoming?.destination) {
      void search();
    }
    // Run once on mount only, to auto-run a search handed off from the landing page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
        {user?.name ? `Where to, ${user.name.split(" ")[0]}?` : "Where to?"}
      </h1>
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-[1.15fr_1.15fr_0.9fr_0.55fr]">
          <PlaceInput label="From" placeholder="City or place" place={origin} onSelect={setOrigin} />
          <PlaceInput label="To" placeholder="City or place" place={destination} onSelect={setDestination} />
          <label className="text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Date</span>
            <input
              type="date"
              value={date}
              min={toDateKey(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border-b-2 border-line bg-transparent py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Seats</span>
            <input
              type="number"
              min={1}
              max={4}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="mt-1 w-full border-b-2 border-line bg-transparent py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search rides"}
        </button>
      </div>

      {searched ? (
        <div className="mt-8">
          {searchNote ? (
            <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{searchNote}</p>
          ) : null}
          {matches.length === 0 && !searching ? (
            <p className="mt-10 text-center text-sm text-ink-faint">No rides found for this route yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {matches.map((trip) => (
                <RideCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => {
                    setSelectedMatch(trip);
                    navigate(`/rides/${trip.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
