import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { BookingStatus } from "@rideshare/types";
import { paymentGet } from "../services/api";
import { useTripStore } from "../store/tripStore";
import { Icon, icons } from "../components/Icon";
import { Page } from "../components/ui";

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
    <Page width="sm">
      <div className="py-8 text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${paid ? "bg-brand text-white shadow-glow" : "bg-amber-100 text-amber-700"}`}
        >
          {paid ? <Icon path={icons.check} className="h-9 w-9" /> : <Icon path={icons.clock} className="h-8 w-8" />}
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink">
          {paid ? "You're booked!" : "Waiting for payment"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {paid
            ? "Your seat is confirmed. Find this trip under My trips — and check driver details before you leave."
            : "This checks with Razorpay every few seconds — hang tight."}
        </p>
        <Link
          to="/trips"
          className={`mt-8 inline-block w-full rounded-full py-3.5 text-sm font-bold shadow-card transition ${
            paid ? "bg-brand text-white hover:bg-brand-dark" : "pointer-events-none bg-line text-ink-faint"
          }`}
        >
          View my trips
        </Link>
        {paid ? (
          <Link to="/search" className="mt-3 inline-block text-sm font-bold text-brand hover:underline">
            Book another ride
          </Link>
        ) : null}
      </div>
    </Page>
  );
}
