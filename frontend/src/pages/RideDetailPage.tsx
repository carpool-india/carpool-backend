import { useNavigate, useParams } from "react-router-dom";
import { haversineKm } from "@rideshare/utils";
import { useTripStore } from "../store/tripStore";

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function RideDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const trip = useTripStore((state) => state.selectedMatch ?? state.matches.find((item) => item.id === tripId));

  if (!trip) {
    return <p className="mx-auto max-w-xl px-6 py-12 text-sm text-ink-faint">This ride is no longer available — search again.</p>;
  }

  const distanceKm = haversineKm(trip.originPoint.lat, trip.originPoint.lng, trip.destinationPoint.lat, trip.destinationPoint.lng);
  const departure = new Date(trip.departureTime);

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
        {trip.originName} → {trip.destinationName}
      </p>
      <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">Confirm your ride</h1>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light text-lg font-bold text-brand-dark">
            {trip.driverPhotoUrl ? (
              <img src={trip.driverPhotoUrl} alt={trip.driverName} className="h-full w-full object-cover" />
            ) : (
              initials(trip.driverName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ink">{trip.driverName}</p>
            <p className="text-xs text-ink-faint">
              {trip.vehicleType === "bike" ? "Bike" : "Car"}
              {trip.vehicleRegistration ? ` · ${trip.vehicleRegistration}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-light px-3 py-1.5 text-sm font-extrabold text-brand-dark">
            {trip.trustScore} Trust
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
          <div>
            <p className="text-ink-faint">Departure</p>
            <p className="mt-0.5 font-bold text-ink">
              {departure.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div>
            <p className="text-ink-faint">Distance</p>
            <p className="mt-0.5 font-bold text-ink">{distanceKm.toFixed(0)} km</p>
          </div>
          <div>
            <p className="text-ink-faint">Seats left</p>
            <p className="mt-0.5 font-bold text-ink">{trip.seatsAvailable}</p>
          </div>
          <div>
            <p className="text-ink-faint">Price per seat</p>
            <p className="mt-0.5 font-bold text-ink">₹{trip.pricePerSeat}</p>
          </div>
        </div>

        {trip.isWomenOnly || trip.instantBook ? (
          <div className="mt-4 flex gap-2 border-t border-line pt-4">
            {trip.isWomenOnly ? <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-700">Women only</span> : null}
            {trip.instantBook ? <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-dark">Instant book</span> : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => navigate(`/rides/${trip.id}/book`)}
        className="mt-6 w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark"
      >
        Book this seat
      </button>
    </div>
  );
}
