import { scoreFraudSignals } from "../services/fraud.service";
import { triggerSos } from "../services/sos.service";
import { HttpError } from "../lib/errors";

const baseInput = {
  tripId: "11111111-1111-1111-1111-111111111111",
  lat: 12.9716,
  lng: 77.5946,
};

describe("SOS hold rule", () => {
  it("rejects a hold shorter than 2 seconds, before touching the network", async () => {
    // holdDurationMs is checked before any Supabase/fetch call, so this exercises
    // real triggerSos behavior without needing to mock the network layer.
    await expect(
      triggerSos("fake-access-token", "fake-supabase-auth-id", { ...baseInput, holdDurationMs: 1500 })
    ).rejects.toThrow(HttpError);
  });

  it("rejects with a 400 and a clear message on a too-short hold", async () => {
    await expect(
      triggerSos("fake-access-token", "fake-supabase-auth-id", { ...baseInput, holdDurationMs: 0 })
    ).rejects.toMatchObject({ status: 400, code: "hold_too_short", message: "SOS requires a 2 second hold" });
  });
});

describe("fraud flags", () => {
  it("flags stacked OTP failures and incomplete KYC", () => {
    const result = scoreFraudSignals({
      otpFailures: 3,
      cancellations: 1,
      offRouteEvents: 0,
      unverifiedKyc: true,
    });
    expect(result.flag).toBe(true);
    expect(result.scoreDelta).toBeLessThan(0);
  });
});
