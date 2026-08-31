export type SafetyEventType = "sos" | "route_deviation" | "otp_fail" | "fraud_flag";

export type SafetySeverity = "low" | "medium" | "high" | "critical";

export interface SafetyEvent {
  id: string;
  tripId: string | null;
  bookingId: string | null;
  userId: string;
  eventType: SafetyEventType;
  severity: SafetySeverity;
  lat: number | null;
  lng: number | null;
  metadata: Record<string, string | number | boolean | null>;
  resolved: boolean;
  createdAt: string;
}

export interface SosTriggerInput {
  tripId: string;
  bookingId?: string;
  lat: number;
  lng: number;
  holdDurationMs: number;
}

export interface RouteDeviationInput {
  tripId: string;
  lat: number;
  lng: number;
  expectedPolyline: string;
  thresholdKm?: number;
}

export interface RatingInput {
  bookingId: string;
  rateeId: string;
  stars: number;
  comment?: string;
  tags?: string[];
}

export interface Rating {
  id: string;
  bookingId: string;
  raterId: string;
  rateeId: string;
  stars: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
}

export interface FraudFlag {
  userId: string;
  reason: string;
  scoreDelta: number;
  evidence: Record<string, string | number | boolean | null>;
}

export interface TrustScoreBreakdown {
  userId: string;
  kycPoints: number;
  ratingPoints: number;
  completionPoints: number;
  cancellationPenalty: number;
  fraudPenalty: number;
  total: number;
}
