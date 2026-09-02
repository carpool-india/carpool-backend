import type { SearchMatch } from "../store/tripStore";

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function RideCard({ trip, onClick }: { trip: SearchMatch; onClick: () => void }) {
  const departure = new Date(trip.departureTime);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-floating"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink-soft">
          {trip.originName} <span className="text-ink-faint">→</span> {trip.destinationName}
        </p>
        <span className="text-lg font-extrabold text-ink">₹{trip.pricePerSeat}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light text-sm font-bold text-brand-dark">
          {trip.driverPhotoUrl ? (
            <img src={trip.driverPhotoUrl} alt={trip.driverName} className="h-full w-full object-cover" />
          ) : (
            initials(trip.driverName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{trip.driverName}</p>
          <p className="text-xs text-ink-faint">
            {departure.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-extrabold text-brand-dark">
          {trip.trustScore} Trust
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-faint">
        <span>{trip.seatsAvailable} seat{trip.seatsAvailable === 1 ? "" : "s"} left</span>
        {trip.isWomenOnly ? <span className="rounded-full bg-pink-50 px-2 py-0.5 text-pink-700">Women only</span> : null}
        {trip.instantBook ? <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark">Instant book</span> : null}
      </div>
    </button>
  );
}
