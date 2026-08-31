import { computeNextExpiry } from "../services/subscription.service";

describe("computeNextExpiry", () => {
  it("extends a weekly plan by 7 days from now when there's no current expiry", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = computeNextExpiry("weekly", null, now);
    expect(expiresAt).toBe("2026-01-08T00:00:00.000Z");
  });

  it("extends a monthly plan by 30 days from now when the previous plan already lapsed", () => {
    const now = new Date("2026-01-15T00:00:00.000Z");
    const pastExpiry = "2026-01-01T00:00:00.000Z";
    const expiresAt = computeNextExpiry("monthly", pastExpiry, now);
    expect(expiresAt).toBe("2026-02-14T00:00:00.000Z");
  });

  it("extends from the current expiry, not from now, when renewing early", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const futureExpiry = "2026-01-10T00:00:00.000Z";
    const expiresAt = computeNextExpiry("weekly", futureExpiry, now);
    // Renewing 9 days before expiry should not waste those 9 days —
    // the new expiry is 7 days after the OLD expiry, not 7 days after today.
    expect(expiresAt).toBe("2026-01-17T00:00:00.000Z");
  });
});
