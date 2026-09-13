import {
  describeOverchargeError,
  describeTripTypeMismatch,
  isTripTypeValidForDistance,
  LOCAL_TRIP_MAX_KM,
  maxAllowedFarePerSeat,
  suggestPricePerSeat,
} from "./pricing";

describe("suggestPricePerSeat", () => {
  it("charges the intracity flat rate per km", () => {
    expect(suggestPricePerSeat(10, "intracity")).toBe(80);
  });

  it("floors intracity pricing at the minimum fare for very short hops", () => {
    expect(suggestPricePerSeat(2, "intracity")).toBe(40);
  });

  it("stays within a single intercity band under 100km", () => {
    expect(suggestPricePerSeat(50, "intercity")).toBe(110);
  });

  it("blends rates across intercity bands for a long trip", () => {
    // 100km @ 2.2 + 200km @ 1.8 + 50km @ 1.5 = 220 + 360 + 75
    expect(suggestPricePerSeat(350, "intercity")).toBe(655);
  });

  it("never goes negative for a zero-distance trip", () => {
    expect(suggestPricePerSeat(0, "intracity")).toBe(40);
    expect(suggestPricePerSeat(0, "intercity")).toBe(0);
  });
});

describe("isTripTypeValidForDistance", () => {
  it("accepts intracity trips at or under the local limit", () => {
    expect(isTripTypeValidForDistance(LOCAL_TRIP_MAX_KM, "intracity")).toBe(true);
    expect(isTripTypeValidForDistance(10, "intracity")).toBe(true);
  });

  it("rejects intracity trips over the local limit", () => {
    expect(isTripTypeValidForDistance(LOCAL_TRIP_MAX_KM + 1, "intracity")).toBe(false);
  });

  it("rejects intercity trips at or under the local limit", () => {
    expect(isTripTypeValidForDistance(LOCAL_TRIP_MAX_KM, "intercity")).toBe(false);
    expect(isTripTypeValidForDistance(10, "intercity")).toBe(false);
  });

  it("accepts intercity trips over the local limit", () => {
    expect(isTripTypeValidForDistance(LOCAL_TRIP_MAX_KM + 1, "intercity")).toBe(true);
  });
});

describe("describeTripTypeMismatch", () => {
  it("flags a long route posted as Local", () => {
    expect(describeTripTypeMismatch(200, "intracity")).toMatch(/Outstation instead/);
  });

  it("flags a short route posted as Outstation", () => {
    expect(describeTripTypeMismatch(10, "intercity")).toMatch(/Local instead/);
  });

  it("returns null for a consistent route/type pairing", () => {
    expect(describeTripTypeMismatch(10, "intracity")).toBeNull();
    expect(describeTripTypeMismatch(200, "intercity")).toBeNull();
  });
});

describe("maxAllowedFarePerSeat / describeOverchargeError", () => {
  it("allows up to the multiplier above the suggested fare", () => {
    const suggested = suggestPricePerSeat(10, "intracity"); // 80
    const max = maxAllowedFarePerSeat(10, "intracity");
    expect(max).toBe(Math.round(suggested * 1.5));
    expect(describeOverchargeError(max, 10, "intracity")).toBeNull();
  });

  it("flags a price above the allowed maximum", () => {
    const max = maxAllowedFarePerSeat(10, "intracity");
    expect(describeOverchargeError(max + 1, 10, "intracity")).toMatch(/too high/);
  });
});
