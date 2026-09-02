import { create } from "zustand";
import type { Booking, GeoPoint, Trip } from "@rideshare/types";
import type { MapPlace } from "../services/places";

export interface SearchMatch extends Trip {
  trustScore: number;
  averageStars: number;
  ratingCount: number;
  driverName: string;
  driverPhotoUrl: string | null;
  pickupPoint: GeoPoint;
  dropoffPoint: GeoPoint;
  detourKm: number;
  score: number;
}

interface TripState {
  activeBooking: Booking | null;
  selectedMatch: SearchMatch | null;
  matches: SearchMatch[];
  searchNote: string | null;
  setActiveBooking: (booking: Booking | null) => void;
  setSelectedMatch: (match: SearchMatch | null) => void;
  setMatches: (matches: SearchMatch[]) => void;
  setSearchNote: (note: string | null) => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeBooking: null,
  selectedMatch: null,
  matches: [],
  searchNote: null,
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  setSelectedMatch: (selectedMatch) => set({ selectedMatch }),
  setMatches: (matches) => set({ matches }),
  setSearchNote: (searchNote) => set({ searchNote }),
}));

export type { MapPlace };
