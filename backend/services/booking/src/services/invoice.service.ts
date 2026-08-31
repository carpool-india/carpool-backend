import { SERVICE_FEE_RATE, type PriceBreakdown } from "@rideshare/types";

export function buildPriceBreakdown(
  pricePerSeat: number,
  seatsBooked: number,
  feeWaived = false
): PriceBreakdown {
  const seatFare = round2(pricePerSeat);
  const subtotal = round2(seatFare * seatsBooked);
  const serviceFee = feeWaived ? 0 : round2(subtotal * SERVICE_FEE_RATE);
  // totalAmount is what's actually charged through the app (the platform fee).
  // The fare itself (subtotal) is settled directly between passenger and driver via UPI/cash.
  const totalAmount = serviceFee;
  return {
    seatFare,
    seatsBooked,
    subtotal,
    serviceFee,
    totalAmount,
    feeWaived,
    currency: "INR",
  };
}

export interface InvoiceInput {
  invoiceNumber: string;
  bookingId: string;
  passengerName: string;
  driverName: string;
  originName: string;
  destinationName: string;
  departureTime: string;
  breakdown: PriceBreakdown;
}

export function generateInvoicePdf(input: InvoiceInput): Buffer {
  const lines = [
    "RideShare India — Payment Receipt",
    `Invoice: ${input.invoiceNumber}`,
    `Booking: ${input.bookingId}`,
    `Passenger: ${input.passengerName}`,
    `Driver: ${input.driverName}`,
    `Route: ${input.originName} to ${input.destinationName}`,
    `Departure: ${input.departureTime}`,
    `Seat fare (pay driver directly via UPI/cash): INR ${input.breakdown.seatFare.toFixed(2)} x ${input.breakdown.seatsBooked} = INR ${input.breakdown.subtotal.toFixed(2)}`,
    `This receipt covers the platform fee only, charged via the app:`,
    `Platform fee: INR ${input.breakdown.serviceFee.toFixed(2)}`,
    `Total charged via app: INR ${input.breakdown.totalAmount.toFixed(2)}`,
  ];
  return renderSimplePdf(lines);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function renderSimplePdf(lines: string[]): Buffer {
  const escaped = lines.map((line) => line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"));
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...escaped.flatMap((line, index) => (index === 0 ? [`(${line}) Tj`] : ["0 -18 Td", `(${line}) Tj`])),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
