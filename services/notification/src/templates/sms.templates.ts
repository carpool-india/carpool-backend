export const smsTemplates = {
  otp: (otp: string) =>
    `${otp} is your RideShare India login OTP. Valid for 5 minutes. Do not share this with anyone.`,
  bookingConfirmed: (origin: string, destination: string, time: string) =>
    `Booking confirmed: ${origin} to ${destination} at ${time}. Open RideShare India for live tracking.`,
  driverCancelled: (origin: string, destination: string) =>
    `Your ride ${origin} to ${destination} was cancelled by the driver. Refund will be processed automatically.`,
  sosAck: () =>
    `RideShare India SOS received. We are alerting 112, your emergency contacts, and our safety desk now.`,
};

export const whatsappTemplates = {
  bookingCard: (input: {
    passengerName: string;
    origin: string;
    destination: string;
    departure: string;
    driverName: string;
    vehicle: string;
    amount: string;
  }) => ({
    type: "booking_confirm_v1",
    body: [
      `Namaste ${input.passengerName}`,
      `${input.origin} → ${input.destination}`,
      `Time: ${input.departure}`,
      `Driver: ${input.driverName}`,
      `Vehicle: ${input.vehicle}`,
      `Paid: ₹${input.amount} (UPI escrow)`,
    ].join("\n"),
  }),
  otpCard: (phoneMasked: string, otp: string) => ({
    type: "otp_card_v1",
    body: `RideShare India OTP for ${phoneMasked}: ${otp}. Valid 5 minutes.`,
  }),
};
