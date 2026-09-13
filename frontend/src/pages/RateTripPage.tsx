import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { safetyPost } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTripStore } from "../store/tripStore";
import { Page, PrimaryButton } from "../components/ui";

export function RateTripPage() {
  const navigate = useNavigate();
  const booking = useTripStore((state) => state.activeBooking);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rateeId = booking?.trip?.driverId;

  async function submit() {
    if (!booking || !rateeId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await safetyPost("/ratings", {
        bookingId: booking.id,
        rateeId,
        stars,
        comment: comment.trim() || undefined,
        tags: stars >= 5 ? ["safe", "on_time"] : ["needs_improvement"],
      });
      navigate("/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit rating");
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking || !rateeId || rateeId === currentUserId) {
    return (
      <Page width="sm">
        <div className="py-10 text-center">
          <h1 className="font-display text-2xl font-extrabold text-ink">Nothing to rate here</h1>
          <p className="mt-2 text-sm text-ink-soft">Open this from a completed trip in My trips to rate your driver.</p>
          <button
            type="button"
            onClick={() => navigate("/trips")}
            className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to my trips
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page width="sm">
      <div className="py-6 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">How was your ride?</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {booking.trip ? `${booking.trip.originName} → ${booking.trip.destinationName}` : ""}
        </p>
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStars(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper text-3xl transition hover:bg-brand-light"
            >
              <span className={value <= stars ? "text-amber-400" : "text-line"}>★</span>
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the ride? (optional)"
          rows={4}
          className="mt-6 w-full rounded-3xl border border-line bg-white px-4 py-4 text-sm text-ink outline-none focus:border-brand"
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6">
          <PrimaryButton type="button" onClick={() => void submit()} disabled={submitting} className="w-full">
            {submitting ? "Submitting…" : "Submit rating"}
          </PrimaryButton>
        </div>
      </div>
    </Page>
  );
}
