export const REPORT_REASONS = [
  "unsafe_driving",
  "no_show",
  "harassment",
  "fraud_or_payment",
  "fake_profile",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface CreateReportInput {
  reportedId: string;
  reason: ReportReason;
  details?: string;
  tripId?: string;
  bookingId?: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
}
