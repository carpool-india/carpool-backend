import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { BookingStatus } from "@rideshare/types";
import { paymentGet } from "../services/api";
import { useTripStore } from "../store/tripStore";

export function BookingConfirmedPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const booking = useTripStore((state) => state.activeBooking);
  const setActiveBooking = useTripStore((state) => state.setActiveBooking);
  const [status, setStatus] = useState<BookingStatus>(booking?.status ?? "pending");

  useEffect(() => {
    if (status === "confirmed" || !bookingId) {
      return;
    }
    let cancelled = false;
    async function poll() {
      const result = await paymentGet<{ status: string }>(`/status?bookingId=${bookingId}`);
      if (cancelled) {
        return;
      }
      if (result.status === "captured") {
        setStatus("confirmed");
        if (booking) {
          setActiveBooking({ ...booking, status: "confirmed" });
        }
      }
    }
    void poll();
    const timer = setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [status, booking, bookingId, setActiveBooking]);

  const paid = status === "confirmed";

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${paid ? "bg-brand" : "bg-amber-100"}`}>
        <span className={`text-3xl ${paid ? "text-white" : "text-amber-600"}`}>{paid ? "✓" : "⏳"}</span>
      </div>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink">
        {paid ? "You're booked!" : "Waiting for payment"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        {paid
          ? "Your seat is confirmed. Find this trip under My Trips."
          : "This checks with Razorpay every few seconds — hang tight."}
      </p>
      <Link
        to="/"
        className={`mt-8 inline-block w-full rounded-full py-3.5 text-sm font-bold shadow-card transition ${
          paid ? "bg-brand text-white hover:bg-brand-dark" : "pointer-events-none bg-line text-ink-faint"
        }`}
      >
        Back to search
      </Link>
    </div>
  );
}
