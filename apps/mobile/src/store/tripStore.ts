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

export interface RecentSearch {
  origin: string;
  destination: string;
  date: string;
  seats: string;
}

interface TripState {
  activeTrip: Trip | null;
  activeBooking: Booking | null;
  selectedMatch: SearchMatch | null;
  matches: SearchMatch[];
  searchNote: string | null;
  recentSearches: RecentSearch[];
  recentPlaces: MapPlace[];
  setActiveTrip: (trip: Trip | null) => void;
  setActiveBooking: (booking: Booking | null) => void;
  setSelectedMatch: (match: SearchMatch | null) => void;
  setMatches: (matches: SearchMatch[]) => void;
  setSearchNote: (note: string | null) => void;
  addRecentSearch: (search: RecentSearch) => void;
  addRecentPlace: (place: MapPlace) => void;
  clear: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  activeBooking: null,
  selectedMatch: null,
  matches: [],
  searchNote: null,
  recentSearches: [],
  recentPlaces: [],
  setActiveTrip: (activeTrip) => set({ activeTrip }),
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  setSelectedMatch: (selectedMatch) => set({ selectedMatch }),
  setMatches: (matches) => set({ matches }),
  setSearchNote: (searchNote) => set({ searchNote }),
  addRecentSearch: (search) =>
    set((state) => ({
      recentSearches: [
        search,
        ...state.recentSearches.filter(
          (item) =>
            !(item.origin === search.origin && item.destination === search.destination && item.date === search.date)
        ),
      ].slice(0, 5),
    })),
  addRecentPlace: (place) =>
    set((state) => ({
      recentPlaces: [place, ...state.recentPlaces.filter((item) => item.placeId !== place.placeId)].slice(0, 8),
    })),
  clear: () =>
    set({
      activeTrip: null,
      activeBooking: null,
      selectedMatch: null,
      matches: [],
      searchNote: null,
    }),
}));
