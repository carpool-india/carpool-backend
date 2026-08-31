import { CANCELLATION_BOND_INR } from "@rideshare/types";

export type CancellationActor = "passenger" | "driver";

export interface BondDecision {
  forfeited: boolean;
  amountInr: number;
  reason: string;
}

export function evaluateCancellationBond(
  actor: CancellationActor,
  hoursUntilDeparture: number,
  bondPaid: boolean
): BondDecision {
  if (!bondPaid) {
    return { forfeited: false, amountInr: 0, reason: "No cancellation bond on this trip" };
  }

  if (actor === "driver") {
    return {
      forfeited: true,
      amountInr: CANCELLATION_BOND_INR,
      reason: "Driver cancelled — ₹150 bond forfeited and passengers auto-refunded",
    };
  }

  if (hoursUntilDeparture < 12) {
    return {
      forfeited: true,
      amountInr: CANCELLATION_BOND_INR,
      reason: "Passenger cancelled within 12 hours of departure — ₹150 bond forfeited",
    };
  }

  return {
    forfeited: false,
    amountInr: 0,
    reason: "Passenger cancelled more than 12 hours before departure — bond released",
  };
}

export function hoursUntil(isoDate: string, now = new Date()): number {
  return (new Date(isoDate).getTime() - now.getTime()) / (1000 * 60 * 60);
}
