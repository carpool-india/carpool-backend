import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SUBSCRIPTION_PLANS, type Subscription, type SubscriptionCadence, type SubscriptionPlanType } from "@rideshare/types";
import { paymentGet, paymentPost } from "../../services/api";
import { openUpiCheckout } from "../../services/razorpay";
import { formatInr } from "../../utils/formatCurrency";
import { t, type AppLanguage } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { ErrorRetry } from "../../components/ui/ErrorRetry";
import { Screen } from "../../components/ui/Screen";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { softShadow } from "../../theme/shadows";

function planLabel(planType: SubscriptionPlanType, cadence: SubscriptionCadence, language: AppLanguage): string {
  if (planType === "passenger") {
    return t(language, "planPassengerMonthly");
  }
  if (planType === "driver_local") {
    return t(language, "planDriverLocalMonthly");
  }
  return cadence === "weekly" ? t(language, "planDriverOutstationWeekly") : t(language, "planDriverOutstationMonthly");
}

function planDescription(planType: SubscriptionPlanType, cadence: SubscriptionCadence, language: AppLanguage): string {
  if (planType === "passenger") {
    return t(language, "planPassengerMonthlyDesc");
  }
  if (planType === "driver_local") {
    return t(language, "planDriverLocalMonthlyDesc");
  }
  return cadence === "weekly" ? t(language, "planDriverOutstationWeeklyDesc") : t(language, "planDriverOutstationMonthlyDesc");
}

export function PlansScreen() {
  const language = useAuthStore((state) => state.language);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    paymentGet<{ subscriptions: Subscription[] }>("/subscriptions/me")
      .then((payload) => setSubscriptions(payload.subscriptions))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function activePlan(planType: SubscriptionPlanType, cadence: SubscriptionCadence): Subscription | undefined {
    return subscriptions.find(
      (item) =>
        item.planType === planType &&
        item.cadence === cadence &&
        item.status === "active" &&
        item.expiresAt &&
        new Date(item.expiresAt).getTime() > Date.now()
    );
  }

  const hasAnyActiveDriverPlan = subscriptions.some(
    (item) =>
      (item.planType === "driver_local" || item.planType === "driver_outstation") &&
      item.status === "active" &&
      item.expiresAt &&
      new Date(item.expiresAt).getTime() > Date.now()
  );
  const hasActivePassengerPlan = subscriptions.some(
    (item) =>
      item.planType === "passenger" &&
      item.status === "active" &&
      item.expiresAt &&
      new Date(item.expiresAt).getTime() > Date.now()
  );

  async function purchase(planType: SubscriptionPlanType, cadence: SubscriptionCadence) {
    const key = `${planType}:${cadence}`;
    setPurchasing(key);
    setError(null);
    try {
      const order = await paymentPost<{ subscriptionId: string; orderId: string; amountPaise: number }>(
        "/subscriptions/order",
        { planType, cadence }
      );
      await openUpiCheckout(order.orderId, order.amountPaise / 100);
      await paymentGet<{ status: string; expiresAt: string | null }>(
        `/subscriptions/status?subscriptionId=${order.subscriptionId}`
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  }

  function PlanCard({ planType, cadence, amountInr }: { planType: SubscriptionPlanType; cadence: SubscriptionCadence; amountInr: number }) {
    const key = `${planType}:${cadence}`;
    const active = activePlan(planType, cadence);
    return (
      <View style={softShadow} className="mb-3 rounded-[24px] bg-white p-4">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 text-base font-bold text-slate-900">{planLabel(planType, cadence, language)}</Text>
          <Text className="text-lg font-extrabold text-brand">{formatInr(amountInr)}</Text>
        </View>
        <Text className="mt-1.5 text-sm leading-5 text-slate-500">{planDescription(planType, cadence, language)}</Text>
        {active ? (
          <View className="mt-3 flex-row items-center self-start rounded-full bg-emerald-50 px-2.5 py-1">
            <Ionicons name="checkmark-circle" size={13} color="#047857" />
            <Text className="ml-1 text-[11px] font-bold text-emerald-700">
              {t(language, "planActiveUntil")} {new Date(active.expiresAt as string).toLocaleDateString("en-IN")}
            </Text>
          </View>
        ) : null}
        <View className="mt-3">
          <PrimaryButton
            label={active ? t(language, "planRenew") : t(language, "planSubscribe")}
            loading={purchasing === key}
            onPress={() => void purchase(planType, cadence)}
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <Screen variant="stacked">
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">…</Text>
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen variant="stacked">
        <ErrorRetry language={language} onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen variant="stacked" scroll>
      <View className="px-4 pt-4">
      <View style={softShadow} className="mb-5 rounded-[24px] bg-white p-4">
        <View className="flex-row items-center">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-brand-light">
            <Ionicons name="information-circle" size={18} color="#0F766E" />
          </View>
          <Text className="ml-2.5 flex-1 text-sm font-bold text-slate-900">{t(language, "planIntroTitle")}</Text>
        </View>
        <Text className="mt-2.5 text-sm leading-5 text-slate-600">{t(language, "planIntroBody")}</Text>
      </View>

      <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{t(language, "planDriverSection")}</Text>
      <View className={`mb-3 flex-row rounded-2xl p-3 ${hasAnyActiveDriverPlan ? "bg-emerald-50" : "bg-amber-50"}`}>
        <Ionicons
          name={hasAnyActiveDriverPlan ? "checkmark-circle" : "lock-closed"}
          size={16}
          color={hasAnyActiveDriverPlan ? "#047857" : "#D97706"}
        />
        <Text className={`ml-2 flex-1 text-xs leading-4 ${hasAnyActiveDriverPlan ? "text-emerald-800" : "text-amber-800"}`}>
          {hasAnyActiveDriverPlan ? t(language, "planDriverActiveNote") : t(language, "planDriverBlockedNote")}
        </Text>
      </View>
      {SUBSCRIPTION_PLANS.filter((plan) => plan.planType !== "passenger").map((plan) => (
        <PlanCard key={`${plan.planType}:${plan.cadence}`} planType={plan.planType} cadence={plan.cadence} amountInr={plan.amountInr} />
      ))}

      <Text className="mb-1 mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t(language, "planPassengerSection")}</Text>
      <View className={`mb-3 flex-row rounded-2xl p-3 ${hasActivePassengerPlan ? "bg-emerald-50" : "bg-[#F4F7F6]"}`}>
        <Ionicons name={hasActivePassengerPlan ? "checkmark-circle" : "cash-outline"} size={16} color={hasActivePassengerPlan ? "#047857" : "#0F766E"} />
        <Text className={`ml-2 flex-1 text-xs leading-4 ${hasActivePassengerPlan ? "text-emerald-800" : "text-slate-600"}`}>
          {hasActivePassengerPlan ? t(language, "planPassengerActiveNote") : t(language, "planPassengerNoPlanNote")}
        </Text>
      </View>
      {SUBSCRIPTION_PLANS.filter((plan) => plan.planType === "passenger").map((plan) => (
        <PlanCard key={`${plan.planType}:${plan.cadence}`} planType={plan.planType} cadence={plan.cadence} amountInr={plan.amountInr} />
      ))}

      {error ? <Text className="mt-1 text-sm text-sos">{error}</Text> : null}
      </View>
    </Screen>
  );
}
