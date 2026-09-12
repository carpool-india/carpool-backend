import { useRef, useState } from "react";
import { safetyPost } from "../services/api";

type SosState = "idle" | "pressing" | "locating" | "sending" | "sent" | "failed" | "location_error";

const HOLD_MS = 2000;

function getCurrentCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location isn't available in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new Error(error.message || "Couldn't get your location")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
    );
  });
}

async function postSosWithRetries(payload: Record<string, unknown>): Promise<void> {
  const attempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await safetyPost("/sos", payload);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError;
}

const labels: Record<SosState, string> = {
  idle: "HOLD 2s",
  pressing: "KEEP HOLDING…",
  locating: "LOCATING…",
  sending: "SENDING…",
  sent: "SENT",
  failed: "FAILED",
  location_error: "NO LOCATION",
};

export function SosButton({ tripId, bookingId }: { tripId: string; bookingId?: string }) {
  const [state, setState] = useState<SosState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function cancelPress() {
    clearTimer();
    setState((current) => (current === "pressing" ? "idle" : current));
  }

  function startPress() {
    if (state === "locating" || state === "sending") {
      return;
    }
    setState("pressing");
    setMessage(null);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void fire();
    }, HOLD_MS);
  }

  async function fire() {
    setState("locating");
    let coords: { lat: number; lng: number };
    try {
      coords = await getCurrentCoords();
    } catch (error) {
      // A real emergency shouldn't be blocked on GPS, but sending a fabricated
      // location would be worse than no location -- surface this clearly and
      // point straight at 112 instead of silently swallowing it.
      setState("location_error");
      setMessage(
        `${error instanceof Error ? error.message : "Couldn't get your location"}. If this is an emergency, call 112 directly.`,
      );
      return;
    }
    setState("sending");
    try {
      await postSosWithRetries({ tripId, bookingId, lat: coords.lat, lng: coords.lng, holdDurationMs: HOLD_MS });
      setState("sent");
      setMessage("Help is on the way. Your emergency contacts and our safety team have been alerted.");
    } catch (error) {
      setState("failed");
      setMessage(
        `${error instanceof Error ? error.message : "Couldn't reach the safety team"}. Call 112 directly if you need help now.`,
      );
    }
  }

  function callEmergency() {
    window.location.href = "tel:112";
  }

  const isBusy = state === "locating" || state === "sending";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label="Hold for 2 seconds to send an SOS alert"
        disabled={isBusy}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        style={{ transitionDuration: state === "pressing" ? `${HOLD_MS}ms` : "150ms" }}
        className={`h-28 w-28 select-none rounded-full border-4 border-red-100 bg-red-600 text-white shadow-card transition-transform disabled:opacity-80 ${
          state === "pressing" ? "scale-90" : "scale-100"
        }`}
      >
        <span className="flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold">SOS</span>
          <span className="px-2 text-center text-[10px] font-bold">{labels[state]}</span>
        </span>
      </button>

      {state === "sent" ? <p className="max-w-xs text-center text-xs font-semibold text-emerald-700">{message}</p> : null}

      {state === "failed" || state === "location_error" ? (
        <div className="flex flex-col items-center gap-2">
          <p className="max-w-xs text-center text-xs font-semibold text-red-600">{message}</p>
          <button type="button" onClick={callEmergency} className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white">
            Call 112 now
          </button>
          <button type="button" onClick={() => setState("idle")} className="text-[11px] font-bold text-ink-faint underline">
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
