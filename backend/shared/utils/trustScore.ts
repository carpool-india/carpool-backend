export interface TrustScoreInputs {
  aadhaarVerified: boolean;
  dlVerified: boolean;
  faceMatchDone: boolean;
  averageStars: number;
  ratingCount: number;
  completedTrips: number;
  cancellations: number;
  fraudFlags: number;
}

export const TRUST_SCORE_WEIGHTS = {
  kyc: 40,
  ratings: 30,
  completion: 20,
  cancellationPenalty: 15,
  fraudPenalty: 20,
} as const;

export function calculateTrustScore(input: TrustScoreInputs): number {
  const kycPoints =
    (input.aadhaarVerified ? 15 : 0) +
    (input.dlVerified ? 15 : 0) +
    (input.faceMatchDone ? 10 : 0);

  const ratingPoints =
    input.ratingCount === 0
      ? 15
      : Math.min(30, (input.averageStars / 5) * 30);

  const completionPoints = Math.min(20, input.completedTrips * 2);
  const cancellationPenalty = Math.min(
    TRUST_SCORE_WEIGHTS.cancellationPenalty,
    input.cancellations * 5
  );
  const fraudPenalty = Math.min(
    TRUST_SCORE_WEIGHTS.fraudPenalty,
    input.fraudFlags * 10
  );

  const raw =
    kycPoints + ratingPoints + completionPoints - cancellationPenalty - fraudPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
