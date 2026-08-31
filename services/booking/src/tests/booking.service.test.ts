import { evaluateCancellationBond } from "../services/cancellationBond.service";
import { buildPriceBreakdown, generateInvoicePdf } from "../services/invoice.service";

describe("cancellationBond", () => {
  it("forfeits driver bond on driver cancel", () => {
    const decision = evaluateCancellationBond("driver", 24, true);
    expect(decision.forfeited).toBe(true);
    expect(decision.amountInr).toBe(150);
  });

  it("forfeits passenger bond inside 12 hours", () => {
    const decision = evaluateCancellationBond("passenger", 4, true);
    expect(decision.forfeited).toBe(true);
  });

  it("releases passenger bond outside 12 hours", () => {
    const decision = evaluateCancellationBond("passenger", 20, true);
    expect(decision.forfeited).toBe(false);
  });
});

describe("invoice", () => {
  it("applies a 10% service fee", () => {
    const breakdown = buildPriceBreakdown(1000, 2);
    expect(breakdown.subtotal).toBe(2000);
    expect(breakdown.serviceFee).toBe(200);
    // totalAmount is the amount charged through the app (platform fee only) —
    // the fare (subtotal) is settled directly between passenger and driver.
    expect(breakdown.totalAmount).toBe(200);
    expect(breakdown.feeWaived).toBe(false);
  });

  it("waives the platform fee when feeWaived is set", () => {
    const breakdown = buildPriceBreakdown(1000, 2, true);
    expect(breakdown.subtotal).toBe(2000);
    expect(breakdown.serviceFee).toBe(0);
    expect(breakdown.totalAmount).toBe(0);
    expect(breakdown.feeWaived).toBe(true);
  });

  it("renders a PDF buffer", () => {
    const pdf = generateInvoicePdf({
      invoiceNumber: "RSI-TEST",
      bookingId: "booking-1",
      passengerName: "Rahul",
      driverName: "Arjun",
      originName: "Chennai",
      destinationName: "Bangalore",
      departureTime: "2026-09-01T06:00:00+05:30",
      breakdown: buildPriceBreakdown(850, 1),
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
