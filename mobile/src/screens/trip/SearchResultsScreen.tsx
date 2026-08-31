import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { RideCard } from "../../components/RideCard";
import { useTripStore } from "../../store/tripStore";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { softShadow } from "../../theme/shadows";

type SortOption = "best" | "price" | "earliest";

const SORT_OPTIONS: { value: SortOption; key: "sortBestMatch" | "sortPriceLow" | "sortEarliest" }[] = [
  { value: "best", key: "sortBestMatch" },
  { value: "price", key: "sortPriceLow" },
  { value: "earliest", key: "sortEarliest" },
];

export function SearchResultsScreen({
  navigation,
}: {
  navigation: { navigate: (name: string, params: { tripId: string }) => void };
}) {
  const matches = useTripStore((state) => state.matches);
  const setSelectedMatch = useTripStore((state) => state.setSelectedMatch);
  const searchNote = useTripStore((state) => state.searchNote);
  const language = useAuthStore((state) => state.language);
  const [sort, setSort] = useState<SortOption>("best");

  const sortedMatches = useMemo(() => {
    const copy = [...matches];
    if (sort === "price") {
      copy.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    } else if (sort === "earliest") {
      copy.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    } else {
      copy.sort((a, b) => b.score - a.score);
    }
    return copy;
  }, [matches, sort]);

  return (
    <Screen variant="stacked">
      <View className="flex-1 px-4 pt-3">
      {searchNote ? (
        <View className="mb-3 flex-row items-center rounded-2xl bg-amber-50 px-3.5 py-3">
          <Ionicons name="calendar-outline" size={16} color="#D97706" />
          <Text className="ml-2 flex-1 text-xs font-semibold leading-4 text-amber-800">{searchNote}</Text>
        </View>
      ) : null}
      {matches.length > 0 ? (
        <View className="mb-3 flex-row gap-2">
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setSort(option.value)}
              style={sort === option.value ? softShadow : undefined}
              className={`rounded-full px-3 py-1.5 ${sort === option.value ? "bg-brand" : "bg-white"}`}
            >
              <Text className={`text-[11px] font-bold ${sort === option.value ? "text-white" : "text-slate-500"}`}>
                {t(language, option.key)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <FlatList
        className="flex-1"
        data={sortedMatches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        {...containedScrollProps}
        ListEmptyComponent={
          <View className="mt-16 items-center px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-light">
              <Ionicons name="car-outline" size={28} color="#0F766E" />
            </View>
            <Text className="mt-4 text-center text-base text-slate-500">{t(language, "noRides")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RideCard
            trip={item}
            trustScore={item.trustScore}
            averageStars={item.averageStars}
            ratingCount={item.ratingCount}
            driverName={item.driverName}
            driverPhotoUrl={item.driverPhotoUrl}
            detourKm={item.detourKm}
            language={language}
            onPress={() => {
              setSelectedMatch(item);
              navigation.navigate("RideDetail", { tripId: item.id });
            }}
          />
        )}
      />
      </View>
    </Screen>
  );
}
