import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import type { TripType } from "@rideshare/types";
import { matchingPost } from "../../services/api";
import { navigateRoot } from "../../navigation/navigateRoot";
import type { TabScreenProps } from "../../navigation/types";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { useTripStore, type SearchMatch } from "../../store/tripStore";
import { TrustScoreBadge } from "../../components/TrustScoreBadge";
import { IconField } from "../../components/ui/IconField";
import { IconPickerField } from "../../components/ui/IconPickerField";
import { PlaceField, geocodePlace, type MapPlace } from "../../components/ui/PlaceField";
import { DecorativeHero } from "../../components/ui/LogoMark";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { cardShadow, softShadow } from "../../theme/shadows";

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatDateDisplay(value: Date): string {
  return value.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

interface MatchPayload {
  matches: Array<{
    trip_id: string;
    driver_id: string;
    origin_name: string;
    destination_name: string;
    departure_time: string;
    seats_available: number;
    price_per_seat: number;
    trust_score: number;
    pickup_point: { lat: number; lng: number };
    dropoff_point: { lat: number; lng: number };
    detour_km: number;
    score: number;
    is_women_only: boolean;
    trip_type: TripType;
    instant_book: boolean;
    vehicle_type?: "car" | "bike" | null;
    vehicle_registration?: string | null;
    driver?: { name?: string | null; photo_url?: string | null; average_stars?: number; rating_count?: number };
    route_polyline?: string | null;
  }>;
}

export function HomeScreen({ navigation }: TabScreenProps<"SearchTab">) {
  const language = useAuthStore((state) => state.language);
  const user = useAuthStore((state) => state.user);
  const gender = user?.gender;
  const setMatches = useTripStore((state) => state.setMatches);
  const setSearchNote = useTripStore((state) => state.setSearchNote);
  const addRecentSearch = useTripStore((state) => state.addRecentSearch);
  const recentSearches = useTripStore((state) => state.recentSearches);
  const [originPlace, setOriginPlace] = useState<MapPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<MapPlace | null>(null);
  const [departureDate, setDepartureDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [seats, setSeats] = useState("");
  const [tripType, setTripType] = useState<TripType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [instantBookOnly, setInstantBookOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  function onChangeDate(event: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && selected) {
      setDepartureDate(selected);
    }
  }

  async function fetchMatches(date: string, origin: MapPlace, destination: MapPlace, seatsNum: number): Promise<SearchMatch[]> {
    const payload = await matchingPost<MatchPayload>("/match", {
      passenger_origin: { lat: origin.lat, lng: origin.lng },
      passenger_destination: { lat: destination.lat, lng: destination.lng },
      date,
      seats_needed: seatsNum,
      passenger_gender: gender,
      trip_type: tripType ?? undefined,
      instant_book_only: instantBookOnly || undefined,
      max_price_per_seat: maxPrice ? Number(maxPrice) : undefined,
    });
    let matches: SearchMatch[] = payload.matches.map((match) => ({
      id: match.trip_id,
      driverId: match.driver_id,
      originName: match.origin_name,
      originPoint: match.pickup_point,
      destinationName: match.destination_name,
      destinationPoint: match.dropoff_point,
      routePolyline: match.route_polyline ?? null,
      departureTime: match.departure_time,
      seatsTotal: match.seats_available,
      seatsAvailable: match.seats_available,
      pricePerSeat: match.price_per_seat,
      status: "active",
      isWomenOnly: match.is_women_only,
      luggagePolicy: "small",
      tripType: match.trip_type,
      instantBook: match.instant_book,
      vehicleType: match.vehicle_type ?? null,
      vehicleRegistration: match.vehicle_registration ?? null,
      cancellationBondPaid: true,
      createdAt: new Date().toISOString(),
      trustScore: match.trust_score,
      averageStars: match.driver?.average_stars ?? 0,
      ratingCount: match.driver?.rating_count ?? 0,
      driverName: match.driver?.name ?? "Verified driver",
      driverPhotoUrl: match.driver?.photo_url ?? null,
      pickupPoint: match.pickup_point,
      dropoffPoint: match.dropoff_point,
      detourKm: match.detour_km,
      score: match.score,
    }));
    if (womenOnly) {
      matches = matches.filter((item) => item.isWomenOnly);
    }
    return matches;
  }

  async function search(
    nextOrigin = originPlace,
    nextDestination = destinationPlace,
    nextDate = toDateKey(departureDate),
    nextSeats = seats || "1"
  ) {
    if (!nextOrigin || !nextDestination) {
      setError(t(language, "selectBothPlaces"));
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const originPoint = nextOrigin;
      const destinationPoint = nextDestination;
      const seatsNum = Number(nextSeats);
      let matches = await fetchMatches(nextDate, originPoint, destinationPoint, seatsNum);
      if (matches.length === 0) {
        const requested = new Date(`${nextDate}T00:00:00`);
        const dayBefore = new Date(requested);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(requested);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const [before, after] = await Promise.all([
          dayBefore.getTime() >= new Date().setHours(0, 0, 0, 0)
            ? fetchMatches(toDateKey(dayBefore), originPoint, destinationPoint, seatsNum).catch(() => [])
            : Promise.resolve([]),
          fetchMatches(toDateKey(dayAfter), originPoint, destinationPoint, seatsNum).catch(() => []),
        ]);
        matches = [...before, ...after];
        setSearchNote(matches.length > 0 ? t(language, "nearbyDatesNote").replace("{date}", formatDateDisplay(requested)) : null);
      } else {
        setSearchNote(null);
      }
      setMatches(matches);
      addRecentSearch({
        origin: originPoint.name,
        destination: destinationPoint.name,
        date: nextDate,
        seats: nextSeats,
      });
      navigateRoot(navigation, "SearchResults");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  return (
    <Screen variant="hero" scroll>
      <DecorativeHero safeTop>
        <View className="px-5 pb-14 pt-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-[2px] text-teal-100">
                  {t(language, "appName")}
                </Text>
                <Text className="mt-2 text-[28px] font-extrabold leading-8 text-white">{t(language, "greeting")}</Text>
              </View>
              <TrustScoreBadge score={user?.trustScore ?? 0} light />
            </View>
            <Text className="mt-2 text-base text-teal-50">
              {t(language, "namaste")}
              {user?.name ? `, ${user.name}` : ""}
            </Text>
          </View>
        </DecorativeHero>

        <View style={cardShadow} className="-mt-10 mx-4 rounded-[28px] bg-white p-4">
          <View className="mb-3 rounded-2xl border border-slate-100 bg-[#F7FAF9]">
            <PlaceField
              embedded
              icon="radio-button-on-outline"
              label={t(language, "from")}
              place={originPlace}
              placeholder={t(language, "leavingFrom")}
              language={language}
              onSelect={setOriginPlace}
            />
            <View className="flex-row items-center pl-12 pr-3">
              <View className="h-px flex-1 bg-slate-200" />
              <Pressable
                onPress={() => {
                  setOriginPlace(destinationPlace);
                  setDestinationPlace(originPlace);
                }}
                className="ml-2 h-8 w-8 items-center justify-center rounded-full border border-teal-100 bg-white"
                style={softShadow}
                hitSlop={8}
              >
                <Ionicons name="swap-vertical" size={16} color="#0F766E" />
              </Pressable>
            </View>
            <PlaceField
              embedded
              icon="location"
              label={t(language, "to")}
              place={destinationPlace}
              placeholder={t(language, "goingTo")}
              language={language}
              onSelect={setDestinationPlace}
            />
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <IconPickerField
                icon="calendar-outline"
                label={t(language, "date")}
                displayValue={formatDateDisplay(departureDate)}
                onPress={() => setShowDatePicker(true)}
              />
            </View>
            <View className="w-28">
              <IconField
                icon="people-outline"
                label={t(language, "passengers")}
                value={seats}
                onChange={setSeats}
                keyboard="numeric"
                placeholder="1"
              />
            </View>
          </View>
          {showDatePicker ? (
            <DateTimePicker
              value={departureDate}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onChangeDate}
            />
          ) : null}
          {Platform.OS === "ios" && showDatePicker ? (
            <View className="mb-3">
              <PrimaryButton label={t(language, "done")} onPress={() => setShowDatePicker(false)} />
            </View>
          ) : null}
          <View className="mb-3 flex-row items-center gap-2">
            {([null, "intracity", "intercity"] as const).map((option) => (
              <Pressable
                key={option ?? "all"}
                onPress={() => setTripType(option)}
                className={`rounded-full px-3.5 py-2 ${tripType === option ? "bg-brand" : "bg-[#F4F7F6]"}`}
              >
                <Text className={`text-xs font-bold ${tripType === option ? "text-white" : "text-slate-600"}`}>
                  {t(language, option === null ? "allTypes" : option)}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowFilters((value) => !value)}
              className={`ml-auto flex-row items-center rounded-full px-3.5 py-2 ${showFilters || instantBookOnly || womenOnly || maxPrice ? "bg-brand-light" : "bg-[#F4F7F6]"}`}
            >
              <Ionicons name="options-outline" size={14} color="#0F766E" />
              <Text className="ml-1 text-xs font-bold text-brand">{t(language, "filters")}</Text>
            </Pressable>
          </View>
          {showFilters ? (
            <View className="mb-3 rounded-2xl bg-[#F7FAF9] p-3">
              {gender === "female" ? (
                <Pressable onPress={() => setWomenOnly((value) => !value)} className="mb-2 flex-row items-center">
                  <Ionicons name={womenOnly ? "checkmark-circle" : "ellipse-outline"} size={18} color={womenOnly ? "#BE185D" : "#94A3B8"} />
                  <Text className="ml-2 text-sm font-semibold text-slate-700">{t(language, "womenOnlyFilter")}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setInstantBookOnly((value) => !value)} className="mb-2 flex-row items-center">
                <Ionicons
                  name={instantBookOnly ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={instantBookOnly ? "#0F766E" : "#94A3B8"}
                />
                <Text className="ml-2 text-sm font-semibold text-slate-700">{t(language, "instantBookFilter")}</Text>
              </Pressable>
              <View className="flex-row items-center">
                <Text className="text-sm font-semibold text-slate-700">{t(language, "maxPrice")}</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  placeholder="₹"
                  placeholderTextColor="#94A3B8"
                  className="ml-2 w-20 rounded-xl bg-white px-2.5 py-1.5 text-sm text-slate-900"
                />
              </View>
            </View>
          ) : null}
          {error ? <Text className="mb-2 text-sm font-medium text-sos">{error}</Text> : null}
          <PrimaryButton
            label={t(language, "search")}
            loading={searching}
            disabled={!originPlace || !destinationPlace}
            onPress={() => void search()}
          />
        </View>

        <View className="mx-4 mt-5 flex-row gap-2">
          <SafetyChip icon="navigate" label={t(language, "liveGps")} />
          <SafetyChip icon="chatbubble-ellipses" label={t(language, "otpChip")} />
          <SafetyChip icon="alert-circle" label={t(language, "sosChip")} />
        </View>

        {recentSearches.length > 0 ? (
          <View className="mx-4 mt-6">
            <Text className="mb-3 text-lg font-extrabold text-slate-900">{t(language, "recentSearches")}</Text>
            {recentSearches.map((item) => (
              <Pressable
                key={`${item.origin}-${item.destination}-${item.date}`}
                onPress={() => {
                  setDepartureDate(new Date(item.date));
                  setSeats(item.seats);
                  void (async () => {
                    try {
                      const from = await geocodePlace(item.origin, { language });
                      const to = await geocodePlace(item.destination, { language });
                      setOriginPlace(from);
                      setDestinationPlace(to);
                      await search(from, to, item.date, item.seats);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : t(language, "noPlaces"));
                    }
                  })();
                }}
                style={softShadow}
                className="mb-2.5 flex-row items-center rounded-2xl bg-white px-4 py-3.5"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light">
                  <Ionicons name="time" size={18} color="#0F766E" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-slate-900">
                    {item.origin} → {item.destination}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {item.date} · {item.seats} {t(language, "seats")}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#0F766E" />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate("PublishTab")}
          style={softShadow}
          className="mx-4 mt-5 flex-row items-center overflow-hidden rounded-[28px] bg-brand p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Ionicons name="car-sport" size={22} color="#FFFFFF" />
          </View>
          <Text className="ml-3 flex-1 text-[15px] font-bold leading-5 text-white">{t(language, "offerRideCta")}</Text>
          <Ionicons name="arrow-forward-circle" size={26} color="#CCFBF1" />
        </Pressable>
    </Screen>
  );
}

function SafetyChip({
  icon,
  label,
}: {
  icon: "navigate" | "chatbubble-ellipses" | "alert-circle";
  label: string;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-white px-2 py-3" style={softShadow}>
      <Ionicons name={icon} size={16} color="#0F766E" />
      <Text className="mt-1 text-center text-[10px] font-bold text-slate-600">{label}</Text>
    </View>
  );
}
