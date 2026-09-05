import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Booking, Trip } from "@rideshare/types";
import { bookingGet, bookingPost, paymentGet, paymentPost } from "../services/api";
import { formatInr, formatTripWhen } from "../utils/format";
import { Alert, Card, EmptyState, Page, PageHeader, PrimaryButton, RouteEndpoints, SegmentedControl, StatusPill } from "../components/ui";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "";

type RideKind = "booked" | "offered";
type RideFilter = "upcoming" | "past" | "cancelled";

function matchesFilter(status: string, departureTime: string | null, filter: RideFilter): boolean {
  if (filter === "cancelled") {
    return status === "cancelled";
  }
  const departed = departureTime !== null && new Date(departureTime).getTime() <= Date.now();
  if (filter === "past") {
    return status !== "cancelled" && (status === "completed" || departed);
  }
  return status !== "cancelled" && status !== "completed" && !departed;
}

export function MyTripsPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<RideKind>("booked");
  const [filter, setFilter] = useState<RideFilter>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function loadBookings() {
    bookingGet<{ bookings: Booking[] }>("/bookings/me")
      .then((payload) => setBookings(payload.bookings))
      .catch(() => setBookings([]));
  }

  function loadTrips() {
    bookingGet<{ trips: Trip[] }>("/trips")
      .then((payload) => setTrips(payload.trips))
      .catch(() => setTrips([]));
  }

  useEffect(() => {
    Promise.all([loadBookings(), loadTrips()]);
    setLoading(false);
  }, []);

  async function cancelBooking(bookingId: string) {
    const reason = window.prompt("Reason for cancelling?");
    if (reason === null) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await bookingPost(`/bookings/${bookingId}/cancel`, { reason, cancelledBy: "passenger" });
      loadBookings();
    } catch {
      // Surfaced implicitly by the booking staying in its current state.
    } finally {
      setCancellingId(null);
    }
  }

  const filteredBookings = bookings.filter((item) => matchesFilter(item.status, item.trip?.departureTime ?? null, filter));
  const filteredTrips = trips.filter((item) => matchesFilter(item.status, item.departureTime, filter));

  return (
    <Page>
      <PageHeader title="My trips" subtitle="Rides you've booked as a passenger, or posted as a driver." />

      <div className="space-y-3">
        <SegmentedControl
          value={kind}
          options={[
            { value: "booked" as const, label: "Booked" },
            { value: "offered" as const, label: "Offered" },
          ]}
          onChange={setKind}
        />
        <SegmentedControl
          value={filter}
          options={[
            { value: "upcoming" as const, label: "Upcoming" },
            { value: "past" as const, label: "Past" },
            { value: "cancelled" as const, label: "Cancelled" },
          ]}
          onChange={setFilter}
        />
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <div className="skeleton h-28 rounded-3xl" />
          <div className="skeleton h-28 rounded-3xl" />
        </div>
      ) : kind === "booked" ? (
        filteredBookings.length === 0 ? (
          <EmptyState
            title="No rides here yet"
            body="Search a route and book a verified seat."
            action={
              <PrimaryButton type="button" onClick={() => navigate("/search")}>
                Find a ride
              </PrimaryButton>
            }
          />
        ) : (
          <div className="mt-6 space-y-4">
            {filteredBookings.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <StatusPill status={item.status} />
                  <span className="font-display text-lg font-extrabold text-brand">{formatInr(item.totalAmount)}</span>
                </div>
                {item.trip ? (
                  <div className="mt-4">
                    <RouteEndpoints
                      from={item.trip.originName}
                      to={item.trip.destinationName}
                      meta={formatTripWhen(item.trip.departureTime)}
                      compact
                    />
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-ink-soft">
                    {item.seatsBooked} seat{item.seatsBooked === 1 ? "" : "s"}
                  </span>
                  {item.status !== "cancelled" && item.status !== "rejected" && item.status !== "completed" ? (
                    <button
                      type="button"
                      onClick={() => void cancelBooking(item.id)}
                      disabled={cancellingId === item.id}
                      className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50"
                    >
                      {cancellingId === item.id ? "Cancelling…" : "Cancel"}
                    </button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          title="You haven't posted any rides yet"
          body="Share empty seats on a trip you're already making."
          action={
            <PrimaryButton type="button" onClick={() => navigate("/post")}>
              Post a ride
            </PrimaryButton>
          }
        />
      ) : (
        <div className="mt-6 space-y-4">
          {filteredTrips.map((item) => (
            <Card key={item.id} className="p-5">
              <RouteEndpoints
                from={item.originName}
                to={item.destinationName}
                meta={`${formatTripWhen(item.departureTime)} · ${item.seatsAvailable}/${item.seatsTotal} seats`}
                compact
              />
              <div className="mt-4">
                <StatusPill status={item.status} />
              </div>
              {!item.cancellationBondPaid && item.status !== "cancelled" ? <BondPrompt tripId={item.id} /> : null}
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}

function BondPrompt({ tripId }: { tripId: string }) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payBond() {
    setPaying(true);
    setError(null);
    try {
      const order = await paymentPost<{ orderId: string; amountPaise: number }>("/trip-bond/order", { tripId });
      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: RAZORPAY_KEY_ID,
          amount: order.amountPaise,
          currency: "INR",
          name: "RideShare India",
          description: "Cancellation bond",
          order_id: order.orderId,
          theme: { color: "#0F766E" },
          handler: () => resolve(),
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        checkout.open();
      });
      const status = await paymentGet<{ status: string }>(`/trip-bond/status?tripId=${tripId}`);
      if (status.status === "paid") {
        setPaid(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  if (paid) {
    return (
      <div className="mt-3">
        <Alert tone="emerald">Cancellation bond paid</Alert>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void payBond()}
        disabled={paying}
        className="w-full rounded-2xl bg-amber-50 px-3 py-2.5 text-left text-xs font-bold text-amber-800 disabled:opacity-60"
      >
        {paying ? "Processing…" : "Pay ₹150 cancellation bond"}
      </button>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
