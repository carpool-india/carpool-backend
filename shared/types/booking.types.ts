import type { GeoPoint } from "./trip.types";

export type BookingStatus = "pending_approval" | "pending" | "confirmed" | "cancelled" | "completed" | "rejected";

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  seatsBooked: number;
  subtotal: number;
  totalAmount: number;
  serviceFee: number;
  status: BookingStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  pickupPoint: GeoPoint | null;
  dropoffPoint: GeoPoint | null;
  createdAt: string;
  trip: { originName: string; destinationName: string; departureTime: string } | null;
}

export interface CreateBookingInput {
  tripId: string;
  seatsBooked: number;
  pickupPoint: GeoPoint;
  dropoffPoint: GeoPoint;
}

export interface CancelBookingInput {
  bookingId: string;
  reason: string;
  cancelledBy: "passenger" | "driver";
}

export interface PriceBreakdown {
  seatFare: number;
  seatsBooked: number;
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  feeWaived: boolean;
  currency: "INR";
}

export const SERVICE_FEE_RATE = 0.1;
export const CANCELLATION_BOND_INR = 150;
