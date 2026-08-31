import { calculateTrustScore, type TrustScoreInputs } from "@rideshare/utils";

export function trustLabel(score: number): string {
  if (score >= 85) {
    return "Excellent";
  }
  if (score >= 70) {
    return "Trusted";
  }
  if (score >= 50) {
    return "Fair";
  }
  return "New";
}

export function computeTrustScore(input: TrustScoreInputs): number {
  return calculateTrustScore(input);
}
