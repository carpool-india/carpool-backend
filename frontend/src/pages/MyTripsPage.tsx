import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Booking, Trip } from "@rideshare/types";
import { bookingGet, bookingPost, paymentGet, paymentPost } from "../services/api";
import { formatInr, formatTripWhen } from "../utils/format";

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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "confirmed" || status === "active" || status === "in_progress"
      ? "bg-emerald-50 text-emerald-700"
      : status === "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-paper text-ink-soft";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${tone}`}>{status.replace("_", " ")}</span>;
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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">My trips</h1>

      <div className="mt-6 flex gap-2 rounded-full bg-white p-1 shadow-card">
        <SegmentButton active={kind === "booked"} label="Booked" onClick={() => setKind("booked")} />
        <SegmentButton active={kind === "offered"} label="Offered" onClick={() => setKind("offered")} />
      </div>
      <div className="mt-3 flex gap-2 rounded-full bg-white p-1 shadow-card">
        {(["upcoming", "past", "cancelled"] as const).map((value) => (
          <SegmentButton key={value} active={filter === value} label={value} onClick={() => setFilter(value)} capitalize />
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-faint">Loading…</p>
      ) : kind === "booked" ? (
        filteredBookings.length === 0 ? (
          <EmptyState message="No rides here yet." action="Find a ride" onClick={() => navigate("/search")} />
        ) : (
          <div className="mt-6 space-y-4">
            {filteredBookings.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <StatusPill status={item.status} />
                  <span className="text-lg font-extrabold text-brand">{formatInr(item.totalAmount)}</span>
                </div>
                {item.trip ? (
                  <div className="mt-3">
                    <p className="text-sm font-bold text-ink">
                      {item.trip.originName} → {item.trip.destinationName}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">{formatTripWhen(item.trip.departureTime)}</p>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-ink-soft">{item.seatsBooked} seat{item.seatsBooked === 1 ? "" : "s"}</span>
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
              </div>
            ))}
          </div>
        )
      ) : filteredTrips.length === 0 ? (
        <EmptyState message="You haven't posted any rides yet." action="Post a ride" onClick={() => navigate("/post")} />
      ) : (
        <div className="mt-6 space-y-4">
          {filteredTrips.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <p className="text-sm font-bold text-ink">
                {item.originName} → {item.destinationName}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {formatTripWhen(item.departureTime)} · {item.seatsAvailable}/{item.seatsTotal} seats
              </p>
              <div className="mt-3 flex items-center justify-between">
                <StatusPill status={item.status} />
              </div>
              {!item.cancellationBondPaid && item.status !== "cancelled" ? <BondPrompt tripId={item.id} /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
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
    return <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800">Cancellation bond paid</p>;
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

function SegmentButton({
  active,
  label,
  onClick,
  capitalize,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  capitalize?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${capitalize ? "capitalize" : ""} ${
        active ? "bg-brand text-white" : "text-ink-soft"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ message, action, onClick }: { message: string; action: string; onClick: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center px-6 text-center">
      <p className="text-sm text-ink-faint">{message}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark"
      >
        {action}
      </button>
    </div>
  );
}
