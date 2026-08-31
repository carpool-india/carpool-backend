export type TripStatus = "active" | "in_progress" | "completed" | "cancelled";

export type LuggagePolicy = "none" | "small" | "large";

export type TripType = "intracity" | "intercity";

export type VehicleType = "car" | "bike";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  driverId: string;
  originName: string;
  originPoint: GeoPoint;
  destinationName: string;
  destinationPoint: GeoPoint;
  routePolyline: string | null;
  departureTime: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  status: TripStatus;
  isWomenOnly: boolean;
  luggagePolicy: LuggagePolicy;
  cancellationBondPaid: boolean;
  tripType: TripType;
  instantBook: boolean;
  vehicleType?: VehicleType | null;
  vehicleRegistration?: string | null;
  createdAt: string;
}

export interface TripWithDriver extends Trip {
  driver: {
    id: string;
    name: string | null;
    photoUrl: string | null;
    trustScore: number;
    averageStars: number;
    ratingCount: number;
    gender: "male" | "female" | "other" | null;
    aadhaarVerified: boolean;
    dlVerified: boolean;
  };
  vehicle: {
    make: string;
    model: string;
    color: string | null;
    registrationNumber: string;
  } | null;
}

export interface CreateTripInput {
  originName: string;
  originPoint: GeoPoint;
  destinationName: string;
  destinationPoint: GeoPoint;
  routePolyline?: string;
  departureTime: string;
  seatsTotal: number;
  pricePerSeat: number;
  isWomenOnly?: boolean;
  luggagePolicy?: LuggagePolicy;
  tripType?: TripType;
  instantBook?: boolean;
  vehicleType: VehicleType;
  vehicleNumber: string;
}

export interface UpdateTripInput {
  departureTime?: string;
  seatsTotal?: number;
  pricePerSeat?: number;
  isWomenOnly?: boolean;
  luggagePolicy?: LuggagePolicy;
  status?: TripStatus;
  routePolyline?: string;
  tripType?: TripType;
  instantBook?: boolean;
}

export interface MatchRequest {
  passengerOrigin: GeoPoint;
  passengerDestination: GeoPoint;
  date: string;
  seatsNeeded: number;
  passengerGender?: "male" | "female" | "other" | null;
  tripType?: TripType;
}

export interface MatchResult {
  trip: TripWithDriver;
  pickupPoint: GeoPoint;
  dropoffPoint: GeoPoint;
  detourKm: number;
  score: number;
  pickupIndex: number;
  dropoffIndex: number;
  tripType: TripType;
}

export interface IntermediateStopRequest {
  tripId: string;
  stopPoint: GeoPoint;
  stopName: string;
}

export interface GpsBroadcastPayload {
  lat: number;
  lng: number;
  tripId: string;
  heading?: number;
  speedKmph?: number;
  recordedAt: string;
}
