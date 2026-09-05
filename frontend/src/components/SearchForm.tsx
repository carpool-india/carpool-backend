import { useState, type FormEvent } from "react";
import { Icon, icons } from "./Icon";
import { PlaceInput } from "./PlaceInput";
import { resolvePlace, type MapPlace } from "../services/places";

export const POPULAR_ROUTES: [string, string][] = [
  ["Chennai", "Bengaluru"],
  ["Chennai", "Pondicherry"],
  ["Coimbatore", "Chennai"],
  ["Madurai", "Chennai"],
];

export function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function SearchForm({
  origin,
  destination,
  date,
  seats,
  onOrigin,
  onDestination,
  onDate,
  onSeats,
  onSubmit,
  submitting = false,
  error = null,
  showPopular = false,
  submitLabel = "Search rides",
  maxSeats = 6,
}: {
  origin: MapPlace | null;
  destination: MapPlace | null;
  date: string;
  seats: number;
  onOrigin: (place: MapPlace | null) => void;
  onDestination: (place: MapPlace | null) => void;
  onDate: (value: string) => void;
  onSeats: (value: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
  showPopular?: boolean;
  submitLabel?: string;
  maxSeats?: number;
}) {
  const [popularBusy, setPopularBusy] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  function swap() {
    const nextOrigin = destination;
    const nextDestination = origin;
    onOrigin(nextOrigin);
    onDestination(nextDestination);
  }

  async function pickPopular(from: string, to: string) {
    setPopularBusy(true);
    try {
      const [a, b] = await Promise.all([resolvePlace(`local:${from.toLowerCase()}`), resolvePlace(`local:${to.toLowerCase()}`)]);
      onOrigin(a);
      onDestination(b);
    } finally {
      setPopularBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_0.85fr_auto_auto] lg:items-end">
        <PlaceInput label="From" placeholder="City or place" place={origin} onSelect={onOrigin} />
        <div className="hidden justify-center pb-1 lg:flex">
          <button
            type="button"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition hover:border-brand hover:text-brand"
          >
            <Icon path={icons.swap} className="h-4 w-4" />
          </button>
        </div>
        <PlaceInput label="To" placeholder="City or place" place={destination} onSelect={onDestination} />
        <label className="text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Date</span>
          <input
            type="date"
            value={date}
            min={toDateKey(new Date())}
            onChange={(e) => onDate(e.target.value)}
            className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
          />
        </label>
        <div className="text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Seats</span>
          <div className="mt-1 flex items-center gap-2 border-b-2 border-line py-1">
            <button
              type="button"
              aria-label="Fewer seats"
              onClick={() => onSeats(Math.max(1, seats - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-lg font-bold text-ink-soft hover:text-brand"
            >
              −
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-extrabold text-ink">{seats}</span>
            <button
              type="button"
              aria-label="More seats"
              onClick={() => onSeats(Math.min(maxSeats, seats + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-lg font-bold text-ink-soft hover:text-brand"
            >
              +
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[46px] items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60 sm:col-span-2 lg:col-span-1 lg:min-w-[148px]"
        >
          <Icon path={icons.search} className="h-4 w-4" />
          {submitting ? "Searching…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={swap}
          className="flex items-center justify-center gap-2 text-xs font-bold text-brand lg:hidden sm:col-span-2"
        >
          <Icon path={icons.swap} className="h-3.5 w-3.5" />
          Swap locations
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {showPopular ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="text-xs font-semibold text-ink-faint">Popular:</span>
          {POPULAR_ROUTES.map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              type="button"
              disabled={popularBusy}
              onClick={() => void pickPopular(a, b)}
              className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
            >
              {a} → {b}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
