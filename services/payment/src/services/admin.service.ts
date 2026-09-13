import { getAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/errors";
import { refundBooking } from "./refund.service";

function range(page: number, limit: number): [number, number] {
  const start = (page - 1) * limit;
  return [start, start + limit - 1];
}

export async function listSubscriptions(page: number, limit: number, planType?: string, status?: string) {
  const client = getAdminClient();
  let query = client
    .from("subscriptions")
    .select("*, users(name, phone)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (planType) query = query.eq("plan_type", planType);
  if (status) query = query.eq("status", status);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [], total: count ?? 0 };
}

export async function listPayments(page: number, limit: number, type?: string, status?: string) {
  const client = getAdminClient();
  let query = client
    .from("payments")
    .select("*, users!payments_payer_id_fkey(name, phone)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [], total: count ?? 0 };
}

export async function getRevenueSummary() {
  const client = getAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  async function sum(type: string, since?: Date) {
    let query = client.from("payments").select("amount, service_fee").eq("type", type).eq("status", "captured");
    if (since) query = query.gte("created_at", since.toISOString());
    const { data, error } = await query;
    if (error) throw new HttpError(400, "bad_request", error.message);
    return (data ?? []).reduce(
      (acc, row) => ({
        amount: acc.amount + Number(row.amount ?? 0),
      }),
      { amount: 0 }
    );
  }

  const [feeAllTime, feeThisMonth, bondAllTime, bondThisMonth] = await Promise.all([
    sum("escrow"),
    sum("escrow", monthStart),
    sum("cancellation_bond"),
    sum("cancellation_bond", monthStart),
  ]);

  const { data: subs } = await client.from("subscriptions").select("amount_inr").eq("status", "active");
  const subscriptionRevenue = (subs ?? []).reduce((acc, row) => acc + Number(row.amount_inr ?? 0), 0);

  return {
    platformFee: { allTime: feeAllTime.amount, thisMonth: feeThisMonth.amount },
    cancellationBonds: { allTime: bondAllTime.amount, thisMonth: bondThisMonth.amount },
    subscriptionRevenueActive: subscriptionRevenue,
  };
}

export async function cancelSubscription(id: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to cancel plan");
  }
  return data;
}

export async function adminRefundBooking(bookingId: string, reason: string) {
  const client = getAdminClient();
  const { data: booking, error } = await client
    .from("bookings")
    .select("id, razorpay_payment_id, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !booking) {
    throw new HttpError(404, "not_found", "Booking not found");
  }
  if (booking.status === "cancelled") {
    throw new HttpError(409, "conflict", "Booking is already cancelled");
  }

  if (booking.razorpay_payment_id) {
    // A real captured payment exists -- reuse the same claim-before-calling-
    // Razorpay idempotency guard the passenger-initiated refund uses, instead
    // of this function's old standalone insert-then-update, which had no
    // protection against two admins (or a retry) both calling Razorpay and
    // both recording a refund for the same booking, and silently recorded a
    // fabricated "ops_recorded" success whenever the real Razorpay call threw.
    const { refundId } = await refundBooking(client, bookingId, reason);
    return { refundId, reason };
  }

  // No captured payment to refund through Razorpay (e.g. admin cancelling
  // before the passenger paid) -- just cancel, guarding against a concurrent
  // cancel/refund the same way: the conditional UPDATE only succeeds once.
  const { data: cancelled } = await client
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .neq("status", "cancelled")
    .select("id")
    .maybeSingle();
  if (!cancelled) {
    throw new HttpError(409, "conflict", "Booking is already cancelled");
  }
  return { refundId: "no_payment_to_refund", reason };
}
