import { create } from "zustand";

interface LocationState {
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speedKmph: number | null;
  updatedAt: string | null;
  setCoords: (lat: number, lng: number, heading?: number, speedKmph?: number) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lng: null,
  heading: null,
  speedKmph: null,
  updatedAt: null,
  setCoords: (lat, lng, heading, speedKmph) =>
    set({
      lat,
      lng,
      heading: heading ?? null,
      speedKmph: speedKmph ?? null,
      updatedAt: new Date().toISOString(),
    }),
}));
