import { Text, View } from "react-native";

export function RouteTimeline({
  origin,
  destination,
  originMeta,
  destinationMeta,
}: {
  origin: string;
  destination: string;
  originMeta?: string;
  destinationMeta?: string;
}) {
  return (
    <View className="flex-row">
      <View className="mr-3 items-center pt-1">
        <View className="h-3 w-3 rounded-full border-2 border-brand bg-white" />
        <View className="my-1 w-0.5 flex-1 rounded-full bg-teal-200" />
        <View className="h-3 w-3 rounded-full bg-amber-500" />
      </View>
      <View className="flex-1">
        <View className="mb-4">
          <Text className="text-base font-bold text-slate-900">{origin}</Text>
          {originMeta ? <Text className="mt-0.5 text-xs text-slate-500">{originMeta}</Text> : null}
        </View>
        <View>
          <Text className="text-base font-bold text-slate-900">{destination}</Text>
          {destinationMeta ? <Text className="mt-0.5 text-xs text-slate-500">{destinationMeta}</Text> : null}
        </View>
      </View>
    </View>
  );
}
