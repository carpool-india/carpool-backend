import { useEffect, useRef, useState } from "react";
import { resolvePlace, suggestPlaces, type MapPlace, type PlacePrediction } from "../services/places";

export function PlaceInput({
  label,
  placeholder,
  place,
  onSelect,
}: {
  label: string;
  placeholder: string;
  place: MapPlace | null;
  onSelect: (place: MapPlace) => void;
}) {
  const [query, setQuery] = useState(place?.name ?? "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionToken = useRef(`${Date.now()}`);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(place?.name ?? "");
  }, [place]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setPredictions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      suggestPlaces(query, { sessionToken: sessionToken.current })
        .then((results) => {
          if (!cancelled) {
            setPredictions(results);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  async function selectPrediction(prediction: PlacePrediction) {
    const resolved = await resolvePlace(prediction.placeId, { sessionToken: sessionToken.current });
    onSelect(resolved);
    setQuery(resolved.name);
    setOpen(false);
    sessionToken.current = `${Date.now()}`;
  }

  return (
    <div ref={wrapperRef} className="relative text-left">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</span>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="mt-1 w-full border-b-2 border-line bg-transparent py-1.5 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-faint outline-none focus:border-brand"
      />
      {open && (predictions.length > 0 || loading) ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-line bg-white py-1 shadow-floating">
          {loading ? <p className="px-4 py-2 text-xs text-ink-faint">Searching…</p> : null}
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => void selectPrediction(prediction)}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-paper"
            >
              <span className="font-semibold text-ink">{prediction.primary}</span>
              {prediction.secondary ? <span className="ml-1.5 text-xs text-ink-faint">{prediction.secondary}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
