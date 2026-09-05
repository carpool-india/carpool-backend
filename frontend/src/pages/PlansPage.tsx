import { useEffect, useState } from "react";
import {
  SUBSCRIPTION_PLANS,
  type Subscription,
  type SubscriptionCadence,
  type SubscriptionPlanType,
} from "@rideshare/types";
import { paymentGet, paymentPost } from "../services/api";
import { formatInr } from "../utils/format";
import { Alert, Badge, Card, Page, PageHeader, PrimaryButton } from "../components/ui";

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
    <Page width="lg">
      <PageHeader
        title="Plans"
        subtitle="Drivers need an active plan to post rides. Passengers can subscribe to waive the platform fee."
      />

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-32 rounded-3xl" />
          <div className="skeleton h-32 rounded-3xl" />
        </div>
      ) : (
        <>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Driver plans</p>
          <Alert tone={hasActiveDriverPlan ? "brand" : "amber"}>
            {hasActiveDriverPlan ? "You have an active driver plan." : "You need an active plan before you can post a ride."}
          </Alert>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <p className="mb-3 mt-10 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Passenger plan</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
    </Page>
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
    <Card className={`p-5 ${active ? "ring-2 ring-brand/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="font-display text-xl font-extrabold text-brand">{formatInr(amountInr)}</p>
      </div>
      {active ? (
        <div className="mt-3">
          <Badge>Active until {new Date(active.expiresAt as string).toLocaleDateString("en-IN")}</Badge>
        </div>
      ) : null}
      <PrimaryButton type="button" onClick={onPurchase} disabled={purchasing} className="mt-5 w-full">
        {purchasing ? "Processing…" : active ? "Renew" : "Subscribe"}
      </PrimaryButton>
    </Card>
  );
}
