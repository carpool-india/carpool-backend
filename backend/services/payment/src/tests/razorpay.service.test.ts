import crypto from "node:crypto";

// verifySignature/verifyWebhookSignature call loadEnv() internally, which
// requires SUPABASE_* to be set even though these two functions never touch
// Supabase -- set fake-but-valid-shaped values so the schema parses, per this
// repo's CI convention of never needing real credentials to run tests.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key-with-enough-length";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-with-length";
process.env.RAZORPAY_KEY_SECRET = "test_key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";

import { verifySignature, verifyWebhookSignature } from "../services/razorpay.service";

describe("verifySignature", () => {
  it("accepts a correctly-signed order/payment pair", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    expect(verifySignature(orderId, paymentId, signature)).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    const forged = crypto.createHmac("sha256", "wrong_secret").update(`${orderId}|${paymentId}`).digest("hex");
    expect(verifySignature(orderId, paymentId, forged)).toBe(false);
  });

  it("rejects a signature for a different order/payment pair", () => {
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update("order_abc123|pay_xyz789")
      .digest("hex");
    expect(verifySignature("order_abc123", "pay_DIFFERENT", signature)).toBe(false);
  });

  it("rejects a signature of the wrong length instead of throwing", () => {
    expect(verifySignature("order_abc123", "pay_xyz789", "short")).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifySignature("order_abc123", "pay_xyz789", "")).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a correctly-signed raw body", () => {
    const rawBody = JSON.stringify({ event: "payment.captured", payload: { id: "pay_1" } });
    const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(rawBody).digest("hex");
    expect(verifyWebhookSignature(rawBody, signature)).toBe(true);
  });

  it("rejects a tampered body signed for different content", () => {
    const original = JSON.stringify({ event: "payment.captured", payload: { id: "pay_1" } });
    const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(original).digest("hex");
    const tampered = JSON.stringify({ event: "payment.captured", payload: { id: "pay_2" } });
    expect(verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    const forged = crypto.createHmac("sha256", "wrong_secret").update(rawBody).digest("hex");
    expect(verifyWebhookSignature(rawBody, forged)).toBe(false);
  });
});
