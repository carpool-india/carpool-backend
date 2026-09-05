import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TripType } from "@rideshare/types";
import { matchingPost } from "../services/api";
import { SearchForm, toDateKey } from "../components/SearchForm";
import { RideCard } from "../components/RideCard";
import { Alert, Card, EmptyState, Page, PageHeader, PrimaryButton } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { useTripStore, type SearchMatch } from "../store/tripStore";
import type { MapPlace } from "../services/places";

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
  const sessionToken = useAuthStore((state) => state.sessionToken);
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

  const firstName = user?.name?.split(" ")[0];

  return (
    <Page width="xl">
      <PageHeader
        title={firstName ? `Where to, ${firstName}?` : "Where to?"}
        subtitle="Compare verified drivers, fares, and seats in one search."
      />

      <Card className="p-5 sm:p-6">
        <SearchForm
          origin={origin}
          destination={destination}
          date={date}
          seats={seats}
          onOrigin={setOrigin}
          onDestination={setDestination}
          onDate={setDate}
          onSeats={setSeats}
          onSubmit={() => void search()}
          submitting={searching}
          error={error}
          showPopular
          maxSeats={4}
        />
      </Card>

      {searched ? (
        <div className="mt-8">
          {searchNote ? (
            <div className="mb-4">
              <Alert>{searchNote}</Alert>
            </div>
          ) : null}
          {searching ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-40 rounded-3xl" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <EmptyState
              title="No rides on this route yet"
              body="Try a nearby date, or post the trip yourself if you're driving that way."
              action={
                <PrimaryButton type="button" onClick={() => navigate(sessionToken ? "/post" : "/login")}>
                  Post a ride
                </PrimaryButton>
              }
            />
          ) : (
            <>
              <p className="mb-4 text-sm font-semibold text-ink-faint">
                {matches.length} ride{matches.length === 1 ? "" : "s"} found
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            </>
          )}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Verified drivers", body: "Aadhaar, DL, and face-match before anyone drives." },
            { title: "See the fare first", body: "Price per seat is locked in before you book." },
            { title: "Tracked the whole way", body: "Live GPS and SOS on every confirmed trip." },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <p className="font-display text-base font-extrabold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
