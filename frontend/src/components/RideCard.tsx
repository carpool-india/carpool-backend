import type { SearchMatch } from "../store/tripStore";
import { Avatar, Badge, RouteEndpoints, TrustBadge } from "./ui";
import { Icon, icons } from "./Icon";

export function RideCard({ trip, onClick }: { trip: SearchMatch; onClick: () => void }) {
  const departure = new Date(trip.departureTime);
  const time = departure.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const day = departure.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-floating"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{day}</p>
          <div className="mt-3 flex gap-4">
            <div className="w-14 shrink-0">
              <p className="font-display text-lg font-extrabold text-ink">{time}</p>
            </div>
            <RouteEndpoints from={trip.originName} to={trip.destinationName} compact />
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-extrabold text-ink">₹{trip.pricePerSeat}</p>
          <p className="text-[11px] font-semibold text-ink-faint">per seat</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
        <Avatar name={trip.driverName} photoUrl={trip.driverPhotoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{trip.driverName}</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            {trip.averageStars > 0 ? (
              <>
                <Icon path={icons.star} className="h-3 w-3 text-accent" />
                {trip.averageStars.toFixed(1)}
                <span>·</span>
              </>
            ) : null}
            {trip.seatsAvailable} seat{trip.seatsAvailable === 1 ? "" : "s"} left
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <TrustBadge score={trip.trustScore} />
          <div className="flex flex-wrap justify-end gap-1">
            {trip.isWomenOnly ? <Badge tone="pink">Women only</Badge> : null}
            {trip.instantBook ? <Badge>Instant</Badge> : null}
          </div>
        </div>
      </div>
    </button>
  );
}
