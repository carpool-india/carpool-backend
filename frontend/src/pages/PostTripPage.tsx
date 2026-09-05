import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Subscription, TripType, VehicleType } from "@rideshare/types";
import { haversineKm, suggestPricePerSeat, vehicleNumberSchema } from "@rideshare/utils";
import { bookingPost, paymentGet } from "../services/api";
import { PlaceInput } from "../components/PlaceInput";
import { useAuthStore } from "../store/authStore";
import { useDriverVehicles } from "../hooks/useDriverVehicles";
import type { MapPlace } from "../services/places";
import { Alert, Card, fieldInputClass, Page, PageHeader, PrimaryButton, SegmentedControl, Toggle } from "../components/ui";

function toDateTimeLocal(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function PostTripPage() {
  const navigate = useNavigate();
  const canDrive = useAuthStore((state) => state.canDrive());
  const user = useAuthStore((state) => state.user);
  const { vehicles, setVehicles, reload } = useDriverVehicles(user?.id);

  const [origin, setOrigin] = useState<MapPlace | null>(null);
  const [destination, setDestination] = useState<MapPlace | null>(null);
  const [tripType, setTripType] = useState<TripType>("intracity");
  const [departureAt, setDepartureAt] = useState(() => toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const [instantBook, setInstantBook] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedVehicle = vehicles[vehicleType];

  useEffect(() => {
    paymentGet<{ subscriptions: Subscription[] }>("/subscriptions/me")
      .then((payload) => setSubscriptions(payload.subscriptions))
      .catch(() => setSubscriptions([]));
    void reload().then((loaded) => {
      if (loaded.car.id) {
        setVehicleType("car");
      } else if (loaded.bike.id) {
        setVehicleType("bike");
        setSeats("1");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSelectVehicleType(next: VehicleType) {
    setVehicleType(next);
    if (next === "bike") {
      setSeats("1");
    }
  }

  function setVehicleNumber(value: string) {
    const upper = value.toUpperCase();
    setVehicles((prev) => ({ ...prev, [vehicleType]: { ...prev[vehicleType], number: upper } }));
  }

  const requiredPlan = tripType === "intercity" ? "driver_outstation" : "driver_local";
  const hasActivePlan = subscriptions.some(
    (item) =>
      item.planType === requiredPlan &&
      item.status === "active" &&
      item.expiresAt &&
      new Date(item.expiresAt).getTime() > Date.now(),
  );

  let suggestedPrice: number | null = null;
  let distanceKm: number | null = null;
  if (origin && destination) {
    distanceKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
    suggestedPrice = suggestPricePerSeat(distanceKm, tripType);
  }

  async function submit() {
    if (!origin || !destination) {
      setError("Choose both a from and to location");
      return;
    }
    const parsedVehicleNumber = vehicleNumberSchema.safeParse(selectedVehicle.number);
    if (!parsedVehicleNumber.success) {
      setError(parsedVehicleNumber.error.issues[0]?.message ?? "Enter a valid vehicle number");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Enter a fare per seat");
      return;
    }
    if (!seats || Number(seats) <= 0) {
      setError("Enter the number of seats");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await bookingPost("/trips", {
        originName: origin.name,
        originPoint: { lat: origin.lat, lng: origin.lng },
        destinationName: destination.name,
        destinationPoint: { lat: destination.lat, lng: destination.lng },
        departureTime: new Date(departureAt).toISOString(),
        seatsTotal: Number(seats),
        pricePerSeat: Number(price),
        isWomenOnly: womenOnly,
        instantBook,
        luggagePolicy: "small",
        tripType,
        vehicleType,
        vehicleNumber: parsedVehicleNumber.data,
      });
      navigate("/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post trip");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page width="md">
      <PageHeader title="Post a ride" subtitle="Set your route, price, and seats — riders can book instantly." />

      {!canDrive ? (
        <div className="mb-5">
          <Alert>Complete KYC verification (Aadhaar, driving licence, face match) before you can post a ride.</Alert>
        </div>
      ) : !hasActivePlan ? (
        <Link to="/plans" className="mb-5 block">
          <Alert>
            You need an active {tripType === "intercity" ? "outstation" : "local"} driver plan to post this ride. View plans →
          </Alert>
        </Link>
      ) : null}

      <Card className="p-6">
        <SegmentedControl
          value={tripType}
          options={[
            { value: "intracity" as const, label: "Local" },
            { value: "intercity" as const, label: "Outstation" },
          ]}
          onChange={setTripType}
        />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlaceInput label="From" placeholder="Leaving from" place={origin} onSelect={setOrigin} />
          <PlaceInput label="To" placeholder="Going to" place={destination} onSelect={setDestination} />
        </div>

        <label className="mt-5 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Departure</span>
          <input
            type="datetime-local"
            value={departureAt}
            min={toDateTimeLocal(new Date())}
            onChange={(e) => setDepartureAt(e.target.value)}
            className={fieldInputClass}
          />
        </label>

        <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Vehicle</p>
        <SegmentedControl
          value={vehicleType}
          options={[
            { value: "car" as const, label: "Car" },
            { value: "bike" as const, label: "Bike" },
          ]}
          onChange={onSelectVehicleType}
        />
        <input
          value={selectedVehicle.number}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder="TN09AB1234"
          className={`${fieldInputClass} mt-3 uppercase tracking-wide placeholder:normal-case`}
        />
        <Link to="/vehicle" className="mt-1.5 inline-block text-xs font-semibold text-brand">
          Manage saved vehicles →
        </Link>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">₹ / seat</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="500"
              className={fieldInputClass}
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Seats</span>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              disabled={vehicleType === "bike"}
              placeholder="1"
              className={`${fieldInputClass} disabled:opacity-50`}
            />
          </label>
        </div>
        {suggestedPrice !== null && distanceKm !== null ? (
          <button
            type="button"
            onClick={() => setPrice(String(suggestedPrice))}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-brand-light px-3 py-2.5 text-left"
          >
            <span className="text-xs font-semibold text-brand-dark">
              {distanceKm.toFixed(0)} km · Suggested ₹{suggestedPrice}
            </span>
            <span className="text-xs font-extrabold text-brand-dark">Use price</span>
          </button>
        ) : null}

        <div className="mt-4 space-y-2">
          <Toggle checked={womenOnly} onChange={setWomenOnly} label="Women only" />
          <Toggle
            checked={instantBook}
            onChange={setInstantBook}
            label={instantBook ? "Instant book" : "Request to book"}
            hint={instantBook ? "Riders can book without approval" : "You approve each booking"}
          />
        </div>
      </Card>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <PrimaryButton
        type="button"
        onClick={() => void submit()}
        disabled={submitting || !canDrive || !hasActivePlan}
        className="mt-6 w-full"
      >
        {submitting ? "Posting…" : "Post ride"}
      </PrimaryButton>
    </Page>
  );
}
