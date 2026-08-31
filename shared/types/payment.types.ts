export type PaymentProvider = "razorpay";

export type PaymentType = "escrow" | "refund" | "cancellation_bond";

export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed"
  | "transferred";

export interface Payment {
  id: string;
  bookingId: string | null;
  tripId: string | null;
  payerId: string;
  payeeId: string | null;
  amount: number;
  serviceFee: number;
  currency: "INR";
  provider: PaymentProvider;
  type: PaymentType;
  status: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
}

export interface CreateOrderInput {
  bookingId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  orderId: string;
  amountPaise: number;
  currency: "INR";
  keyId: string;
  bookingId: string;
}

export interface VerifyPaymentInput {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RefundInput {
  bookingId: string;
  reason: string;
  amountPaise?: number;
}
