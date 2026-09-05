import { useNavigate, useParams } from "react-router-dom";
import { haversineKm } from "@rideshare/utils";
import { useTripStore } from "../store/tripStore";
import { Avatar, Badge, Card, EmptyState, Page, PageHeader, PrimaryButton, RouteEndpoints, TrustBadge } from "../components/ui";
import { Icon, icons } from "../components/Icon";

export function RideDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const trip = useTripStore((state) => state.selectedMatch ?? state.matches.find((item) => item.id === tripId));

  if (!trip) {
    return (
      <Page width="md">
        <EmptyState
          title="This ride is no longer available"
          body="It may have filled up or left. Search again for the same route."
          action={
            <PrimaryButton type="button" onClick={() => navigate("/search")}>
              Search again
            </PrimaryButton>
          }
        />
      </Page>
    );
  }

  const distanceKm = haversineKm(trip.originPoint.lat, trip.originPoint.lng, trip.destinationPoint.lat, trip.destinationPoint.lng);
  const departure = new Date(trip.departureTime);
  const when = departure.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Page width="md">
      <PageHeader kicker="Ride details" title="Confirm your ride" subtitle={`${trip.originName} to ${trip.destinationName}`} />

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Avatar name={trip.driverName} photoUrl={trip.driverPhotoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-extrabold text-ink">{trip.driverName}</p>
            <p className="mt-0.5 text-sm text-ink-faint">
              {trip.vehicleType === "bike" ? "Bike" : "Car"}
              {trip.vehicleRegistration ? ` · ${trip.vehicleRegistration}` : ""}
              {trip.averageStars > 0 ? ` · ${trip.averageStars.toFixed(1)}★` : ""}
            </p>
          </div>
          <TrustBadge score={trip.trustScore} />
        </div>

        <div className="mt-6 rounded-2xl bg-paper p-4">
          <RouteEndpoints from={trip.originName} to={trip.destinationName} meta={when} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { label: "Distance", value: `${distanceKm.toFixed(0)} km` },
            { label: "Seats left", value: String(trip.seatsAvailable) },
            { label: "Price per seat", value: `₹${trip.pricePerSeat}` },
            { label: "Booking", value: trip.instantBook ? "Instant" : "Request" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-paper px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{item.label}</p>
              <p className="mt-1 text-sm font-extrabold text-ink">{item.value}</p>
            </div>
          ))}
        </div>

        {trip.isWomenOnly || trip.instantBook ? (
          <div className="mt-4 flex gap-2">
            {trip.isWomenOnly ? <Badge tone="pink">Women only</Badge> : null}
            {trip.instantBook ? <Badge>Instant book</Badge> : null}
          </div>
        ) : null}
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-light/60 px-4 py-3 text-xs font-semibold text-brand-dark">
        <Icon path={icons.lock} className="mt-0.5 h-4 w-4 shrink-0" />
        Seat fare is paid to the driver. Only the platform fee is collected online at the next step.
      </div>

      <PrimaryButton type="button" onClick={() => navigate(`/rides/${trip.id}/book`)} className="mt-6 w-full">
        Book this seat
      </PrimaryButton>
    </Page>
  );
}
