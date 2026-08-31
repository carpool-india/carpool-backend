import { Text, View } from "react-native";
import type { PriceBreakdown } from "@rideshare/types";
import { formatInr } from "../utils/formatCurrency";

export function PriceBreakdownView({ breakdown }: { breakdown: PriceBreakdown }) {
  return (
    <View className="rounded-[28px] bg-[#F7FAF9] p-5">
      <View className="rounded-2xl bg-white p-4">
        <Row label="Seat fare" value={`${formatInr(breakdown.seatFare)} × ${breakdown.seatsBooked}`} />
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-800">Pay driver directly (UPI/cash)</Text>
          <Text className="text-lg font-extrabold text-slate-900">{formatInr(breakdown.subtotal)}</Text>
        </View>
      </View>

      <View className="mt-4">
        {breakdown.feeWaived ? (
          <Row label="Platform fee" value="Waived — active plan" />
        ) : (
          <Row label="Platform fee (10%)" value={formatInr(breakdown.serviceFee)} />
        )}
        <View className="mt-3 flex-row items-center justify-between border-t border-teal-100 pt-3">
          <Text className="text-base font-bold text-slate-900">Pay via app</Text>
          <Text className="text-2xl font-extrabold text-brand">{formatInr(breakdown.totalAmount)}</Text>
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2.5 flex-row items-center justify-between">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="text-sm font-semibold text-slate-800">{value}</Text>
    </View>
  );
}
