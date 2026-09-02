import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SERVICE_FEE_RATE, type Booking, type PriceBreakdown } from "@rideshare/types";
import { bookingPost, paymentPost } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTripStore } from "../store/tripStore";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "";

export function BookingPaymentPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const trip = useTripStore((state) => state.selectedMatch ?? state.matches.find((item) => item.id === tripId));
  const setActiveBooking = useTripStore((state) => state.setActiveBooking);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!trip) {
    return <p className="mx-auto max-w-md px-6 py-12 text-sm text-ink-faint">This ride is no longer available — search again.</p>;
  }

  const seatsBooked = 1;
  const subtotal = trip.pricePerSeat * seatsBooked;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  const breakdown: PriceBreakdown = {
    seatFare: trip.pricePerSeat,
    seatsBooked,
    subtotal,
    serviceFee,
    totalAmount: serviceFee,
    feeWaived: false,
    currency: "INR",
  };

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const created = await bookingPost<{ booking: Booking; breakdown: PriceBreakdown }>("/bookings", {
        tripId: trip!.id,
        seatsBooked,
        pickupPoint: trip!.pickupPoint,
        dropoffPoint: trip!.dropoffPoint,
      });
      const order = await paymentPost<{ orderId: string | null; amountPaise: number; alreadyConfirmed: boolean }>(
        "/order",
        { bookingId: created.booking.id },
      );

      if (order.alreadyConfirmed || !order.orderId) {
        setActiveBooking({ ...created.booking, status: "confirmed" });
        navigate(`/bookings/${created.booking.id}/confirmed`);
        return;
      }

      const checkout = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: order.amountPaise,
        currency: "INR",
        name: "RideShare India",
        description: `${trip!.originName} → ${trip!.destinationName}`,
        order_id: order.orderId,
        prefill: { contact: user?.phone, name: user?.name ?? undefined },
        theme: { color: "#0F766E" },
        handler: () => {
          setActiveBooking(created.booking);
          navigate(`/bookings/${created.booking.id}/confirmed`);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
        {trip.originName} → {trip.destinationName}
      </p>
      <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">Confirm booking</h1>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">Seat fare (paid to driver directly)</span>
          <span className="font-bold text-ink">₹{breakdown.seatFare}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-ink-soft">Platform fee</span>
          <span className="font-bold text-ink">₹{breakdown.serviceFee.toFixed(2)}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-base">
          <span className="font-bold text-ink">Pay now</span>
          <span className="font-extrabold text-ink">₹{breakdown.totalAmount.toFixed(2)}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Only the platform fee is charged now, via Razorpay. The ride fare itself is paid directly to your driver.
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={() => void pay()}
        disabled={paying}
        className="mt-6 w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
      >
        {paying ? "Opening payment…" : "Pay & confirm"}
      </button>
    </div>
  );
}
