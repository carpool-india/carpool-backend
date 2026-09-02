import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import type { Subscription, TripType, VehicleType } from "@rideshare/types";
import { haversineKm, suggestPricePerSeat, vehicleNumberSchema } from "@rideshare/utils";
import { bookingPost, paymentGet } from "../services/api";
import { PlaceInput } from "../components/PlaceInput";
import { useAuthStore } from "../store/authStore";
import { useDriverVehicles } from "../hooks/useDriverVehicles";
import type { MapPlace } from "../services/places";

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
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Post a ride</h1>
      <p className="mt-2 text-sm text-ink-soft">Set your route, price, and seats — riders can book instantly.</p>

      {!canDrive ? (
        <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Complete KYC verification (Aadhaar, driving licence, face match) before you can post a ride.
        </div>
      ) : !hasActivePlan ? (
        <Link
          to="/plans"
          className="mt-5 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
        >
          <span>You need an active {tripType === "intercity" ? "outstation" : "local"} driver plan to post this ride.</span>
          <span>→</span>
        </Link>
      ) : null}

      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="mb-4 flex gap-2 rounded-2xl bg-paper p-1">
          {(["intracity", "intercity"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTripType(option)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition ${
                tripType === option ? "bg-white text-brand shadow-card" : "text-ink-soft"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <PlaceInput label="From" placeholder="Leaving from" place={origin} onSelect={setOrigin} />
          <PlaceInput label="To" placeholder="Going to" place={destination} onSelect={setDestination} />
        </div>

        <label className="mt-4 block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Departure</span>
          <input
            type="datetime-local"
            value={departureAt}
            min={toDateTimeLocal(new Date())}
            onChange={(e) => setDepartureAt(e.target.value)}
            className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
          />
        </label>

        <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Vehicle</p>
        <div className="mb-3 flex gap-2 rounded-2xl bg-paper p-1">
          {(["car", "bike"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelectVehicleType(option)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold capitalize transition ${
                vehicleType === option ? "bg-white text-brand shadow-card" : "text-ink-soft"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <input
          value={selectedVehicle.number}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder="TN09AB1234"
          className="w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold uppercase tracking-wide text-ink outline-none placeholder:font-normal placeholder:normal-case focus:border-brand"
        />
        <Link to="/vehicle" className="mt-1.5 inline-block text-xs font-semibold text-brand">
          Manage saved vehicles →
        </Link>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">₹ / seat</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="500"
              className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Seats</span>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              disabled={vehicleType === "bike"}
              placeholder="1"
              className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none focus:border-brand disabled:opacity-50"
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

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
          <span className="text-sm font-bold text-ink">Women only</span>
          <button
            type="button"
            role="switch"
            aria-checked={womenOnly}
            onClick={() => setWomenOnly((v) => !v)}
            className={`h-6 w-11 rounded-full p-0.5 transition ${womenOnly ? "bg-brand" : "bg-line"}`}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition ${womenOnly ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
          <div>
            <p className="text-sm font-bold text-ink">{instantBook ? "Instant book" : "Request to book"}</p>
            <p className="text-xs text-ink-faint">
              {instantBook ? "Riders can book without approval" : "You approve each booking"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={instantBook}
            onClick={() => setInstantBook((v) => !v)}
            className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${instantBook ? "bg-brand" : "bg-line"}`}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition ${instantBook ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={submitting || !canDrive || !hasActivePlan}
        className="mt-6 w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint disabled:shadow-none"
      >
        {submitting ? "Posting…" : "Post ride"}
      </button>
    </div>
  );
}
