import { Text, View } from "react-native";

export function StepProgress({
  step,
  total,
  title,
}: {
  step: number;
  total: number;
  title: string;
}) {
  return (
    <View>
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-brand" : "bg-slate-200"}`}
          />
        ))}
      </View>
      <View className="mt-3 flex-row items-baseline justify-between">
        <Text className="text-xl font-extrabold text-slate-900">{title}</Text>
        <Text className="text-xs font-bold text-slate-400">
          {step + 1}/{total}
        </Text>
      </View>
    </View>
  );
}
