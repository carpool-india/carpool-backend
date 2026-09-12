// NOTE: react-native-razorpay is a native module (it wraps Razorpay's native
// Android/iOS Checkout SDKs). Adding or bumping it in package.json is NOT enough —
// it will not appear in an existing dev-client binary until a new EAS dev-client
// build (or a local prebuild) is made. This app already ships expo-dev-client, so
// it's a plain-Expo-Go incompatibility only, not an architecture change.
import RazorpayCheckout from "react-native-razorpay";

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/** Thrown when the user backs out of Checkout instead of a hard payment failure. */
export class RazorpayCancelledError extends Error {
  constructor() {
    super("Payment cancelled");
    this.name = "RazorpayCancelledError";
  }
}

// Razorpay's native Checkout SDKs report user-cancel as error code 2
// ("PAYMENT_CANCELLED") on both Android and iOS. Fall back to sniffing the
// description too, since this hasn't been verified against the exact
// react-native-razorpay version pinned in package.json (not installed in this
// checkout) — double check against installed node_modules/react-native-razorpay's
// README/types once it's added.
const RAZORPAY_CANCELLED_CODE = 2;

export async function openRazorpayCheckout(input: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  name?: string;
  description?: string;
  prefillEmail?: string;
  prefillContact?: string;
}): Promise<RazorpayPaymentResult> {
  try {
    const result = await RazorpayCheckout.open({
      key: input.keyId,
      order_id: input.orderId,
      amount: input.amountPaise,
      currency: "INR",
      name: input.name ?? "RideShare India",
      description: input.description ?? "RideShare India payment",
      ...(input.prefillEmail || input.prefillContact
        ? { prefill: { email: input.prefillEmail, contact: input.prefillContact } }
        : {}),
      theme: { color: "#0F766E" },
    });
    return result;
  } catch (err) {
    const failure = err as { code?: number | string; description?: string } | undefined;
    const description = failure?.description ?? "";
    if (failure?.code === RAZORPAY_CANCELLED_CODE || /cancel/i.test(description)) {
      throw new RazorpayCancelledError();
    }
    throw new Error(description || "Payment failed");
  }
}
