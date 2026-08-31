export type SubscriptionPlanType = "driver_local" | "driver_outstation" | "passenger";

export type SubscriptionCadence = "weekly" | "monthly";

export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled";

export interface SubscriptionPlan {
  planType: SubscriptionPlanType;
  cadence: SubscriptionCadence;
  amountInr: number;
  label: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { planType: "driver_local", cadence: "monthly", amountInr: 79, label: "Local driver — monthly" },
  { planType: "driver_outstation", cadence: "weekly", amountInr: 49, label: "Outstation driver — weekly" },
  { planType: "driver_outstation", cadence: "monthly", amountInr: 149, label: "Outstation driver — monthly" },
  { planType: "passenger", cadence: "monthly", amountInr: 99, label: "Passenger — monthly" },
];

export interface Subscription {
  id: string;
  userId: string;
  planType: SubscriptionPlanType;
  cadence: SubscriptionCadence;
  amountInr: number;
  status: SubscriptionStatus;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateSubscriptionOrderInput {
  planType: SubscriptionPlanType;
  cadence: SubscriptionCadence;
}
