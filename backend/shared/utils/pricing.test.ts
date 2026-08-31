import { suggestPricePerSeat } from "./pricing";

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
