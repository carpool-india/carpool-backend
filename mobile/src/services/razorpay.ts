import { Linking } from "react-native";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const keyId = extra.RAZORPAY_KEY_ID ?? process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "";

export function buildUpiDeepLink(input: {
  orderId: string;
  amountRupees: number;
  payeeName?: string;
}): string {
  const payee = encodeURIComponent(input.payeeName ?? "RideShare India");
  const amount = input.amountRupees.toFixed(2);
  return `upi://pay?pa=${keyId}@razorpay&pn=${payee}&am=${amount}&cu=INR&tn=${encodeURIComponent(input.orderId)}`;
}

export async function openUpiCheckout(orderId: string, amountRupees: number): Promise<void> {
  const url = buildUpiDeepLink({ orderId, amountRupees });
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error("No UPI app is installed on this phone");
  }
  await Linking.openURL(url);
}
