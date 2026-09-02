import { useEffect, useState } from "react";
import {
  SUBSCRIPTION_PLANS,
  type Subscription,
  type SubscriptionCadence,
  type SubscriptionPlanType,
} from "@rideshare/types";
import { paymentGet, paymentPost } from "../services/api";
import { formatInr } from "../utils/format";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "";

export function PlansPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    paymentGet<{ subscriptions: Subscription[] }>("/subscriptions/me")
      .then((payload) => setSubscriptions(payload.subscriptions))
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function activePlan(planType: SubscriptionPlanType, cadence: SubscriptionCadence): Subscription | undefined {
    return subscriptions.find(
      (item) =>
        item.planType === planType &&
        item.cadence === cadence &&
        item.status === "active" &&
        item.expiresAt &&
        new Date(item.expiresAt).getTime() > Date.now(),
    );
  }

  async function purchase(planType: SubscriptionPlanType, cadence: SubscriptionCadence, amountInr: number) {
    const key = `${planType}:${cadence}`;
    setPurchasing(key);
    setError(null);
    try {
      const order = await paymentPost<{ subscriptionId: string; orderId: string; amountPaise: number }>(
        "/subscriptions/order",
        { planType, cadence },
      );
      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: RAZORPAY_KEY_ID,
          amount: order.amountPaise,
          currency: "INR",
          name: "RideShare India",
          description: `${planType.replace("_", " ")} plan · ${cadence}`,
          order_id: order.orderId,
          theme: { color: "#0F766E" },
          handler: () => resolve(),
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        checkout.open();
      });
      await paymentGet<{ status: string; expiresAt: string | null }>(
        `/subscriptions/status?subscriptionId=${order.subscriptionId}`,
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  }

  const driverPlans = SUBSCRIPTION_PLANS.filter((plan) => plan.planType !== "passenger");
  const passengerPlans = SUBSCRIPTION_PLANS.filter((plan) => plan.planType === "passenger");
  const hasActiveDriverPlan = driverPlans.some((plan) => activePlan(plan.planType, plan.cadence));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Plans</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Drivers need an active plan to post rides. Passengers can subscribe to waive the platform fee.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-ink-faint">Loading…</p>
      ) : (
        <>
          <p className="mb-1 mt-8 text-xs font-bold uppercase tracking-wide text-ink-faint">Driver plans</p>
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-xs font-semibold ${
              hasActiveDriverPlan ? "bg-brand-light text-brand-dark" : "bg-amber-50 text-amber-800"
            }`}
          >
            {hasActiveDriverPlan ? "You have an active driver plan." : "You need an active plan before you can post a ride."}
          </div>
          <div className="space-y-3">
            {driverPlans.map((plan) => (
              <PlanCard
                key={`${plan.planType}:${plan.cadence}`}
                label={plan.label}
                amountInr={plan.amountInr}
                active={activePlan(plan.planType, plan.cadence)}
                purchasing={purchasing === `${plan.planType}:${plan.cadence}`}
                onPurchase={() => void purchase(plan.planType, plan.cadence, plan.amountInr)}
              />
            ))}
          </div>

          <p className="mb-1 mt-8 text-xs font-bold uppercase tracking-wide text-ink-faint">Passenger plan</p>
          <div className="space-y-3">
            {passengerPlans.map((plan) => (
              <PlanCard
                key={`${plan.planType}:${plan.cadence}`}
                label={plan.label}
                amountInr={plan.amountInr}
                active={activePlan(plan.planType, plan.cadence)}
                purchasing={purchasing === `${plan.planType}:${plan.cadence}`}
                onPurchase={() => void purchase(plan.planType, plan.cadence, plan.amountInr)}
              />
            ))}
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </>
      )}
    </div>
  );
}

function PlanCard({
  label,
  amountInr,
  active,
  purchasing,
  onPurchase,
}: {
  label: string;
  amountInr: number;
  active: Subscription | undefined;
  purchasing: boolean;
  onPurchase: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="text-lg font-extrabold text-brand">{formatInr(amountInr)}</p>
      </div>
      {active ? (
        <p className="mt-2 inline-block rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand-dark">
          Active until {new Date(active.expiresAt as string).toLocaleDateString("en-IN")}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onPurchase}
        disabled={purchasing}
        className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
      >
        {purchasing ? "Processing…" : active ? "Renew" : "Subscribe"}
      </button>
    </div>
  );
}
