import { useCallback, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { haversineKm, suggestPricePerSeat, vehicleNumberSchema } from "@rideshare/utils";
import type { Subscription, TripType, VehicleType } from "@rideshare/types";
import { bookingPost, paymentGet } from "../../services/api";
import { navigateRoot } from "../../navigation/navigateRoot";
import { t } from "../../i18n/translations";
import type { TabScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { useDriverVehicles } from "../../hooks/useDriverVehicles";
import { IconField } from "../../components/ui/IconField";
import { PlaceField, type MapPlace } from "../../components/ui/PlaceField";
import { IconPickerField } from "../../components/ui/IconPickerField";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { DecorativeHero } from "../../components/ui/LogoMark";
import { Screen } from "../../components/ui/Screen";
import { cardShadow } from "../../theme/shadows";

function withDate(base: Date, next: Date): Date {
  const merged = new Date(base);
  merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
  return merged;
}

function withTime(base: Date, next: Date): Date {
  const merged = new Date(base);
  merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
  return merged;
}

function formatDateDisplay(value: Date): string {
  return value.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function formatTimeDisplay(value: Date): string {
  return value.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function PostTripScreen({ navigation }: TabScreenProps<"PublishTab">) {
  const language = useAuthStore((state) => state.language);
  const canDrive = useAuthStore((state) => state.canDrive());
  const user = useAuthStore((state) => state.user);
  const [originPlace, setOriginPlace] = useState<MapPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<MapPlace | null>(null);
  const [departureAt, setDepartureAt] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const [instantBook, setInstantBook] = useState(true);
  const [tripType, setTripType] = useState<TripType>("intracity");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const { vehicles, setVehicles, reload } = useDriverVehicles(user?.id);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const selectedVehicle = vehicles[vehicleType];
  const vehicleSaved = Boolean(selectedVehicle.id);
  const vehicleNumber = selectedVehicle.number;

  useFocusEffect(
    useCallback(() => {
      paymentGet<{ subscriptions: Subscription[] }>("/subscriptions/me")
        .then((payload) => setSubscriptions(payload.subscriptions))
        .catch(() => setSubscriptions([]));
      void reload().then((loaded) => {
        if (loaded.car.id) {
          setVehicleType("car");
        } else if (loaded.bike.id) {
          setVehicleType("bike");
          setSeats("1");
        }
      });
    }, [reload])
  );

  function setVehicleNumber(value: string) {
    const upper = value.toUpperCase();
    setVehicles((prev) => ({ ...prev, [vehicleType]: { ...prev[vehicleType], number: upper } }));
  }

  const requiredPlan = tripType === "intercity" ? "driver_outstation" : "driver_local";
  const hasActivePlan = subscriptions.some(
    (item) =>
      item.planType === requiredPlan &&
      item.status === "active" &&
      item.expiresAt &&
      new Date(item.expiresAt).getTime() > Date.now()
  );

  function onChangeDate(event: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && selected) {
      setDepartureAt((current) => withDate(current, selected));
    }
  }

  function onChangeTime(event: DateTimePickerEvent, selected?: Date) {
    setShowTimePicker(Platform.OS === "ios");
    if (event.type === "set" && selected) {
      setDepartureAt((current) => withTime(current, selected));
    }
  }

  function onSelectVehicleType(next: VehicleType) {
    setVehicleType(next);
    if (next === "bike") {
      setSeats("1");
    }
  }

  let suggestedPrice: number | null = null;
  let distanceKm: number | null = null;
  if (originPlace && destinationPlace) {
    distanceKm = haversineKm(originPlace.lat, originPlace.lng, destinationPlace.lat, destinationPlace.lng);
    suggestedPrice = suggestPricePerSeat(distanceKm, tripType);
  }

  async function submit() {
    const parsedVehicleNumber = vehicleNumberSchema.safeParse(vehicleNumber);
    if (!parsedVehicleNumber.success) {
      setError(parsedVehicleNumber.error.issues[0]?.message ?? "Enter a valid vehicle number");
      return;
    }
    if (!originPlace || !destinationPlace) {
      setError(t(language, "selectBothPlaces"));
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Enter a fare per seat");
      return;
    }
    if (!seats || Number(seats) <= 0) {
      setError("Enter the number of seats");
      return;
    }
    try {
      await bookingPost("/trips", {
        originName: originPlace.name,
        originPoint: { lat: originPlace.lat, lng: originPlace.lng },
        destinationName: destinationPlace.name,
        destinationPoint: { lat: destinationPlace.lat, lng: destinationPlace.lng },
        departureTime: departureAt.toISOString(),
        seatsTotal: Number(seats),
        pricePerSeat: Number(price),
        isWomenOnly: womenOnly,
        instantBook,
        luggagePolicy: "small",
        tripType,
        vehicleType,
        vehicleNumber: parsedVehicleNumber.data,
      });
      navigation.navigate("RidesTab");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post trip");
    }
  }

  return (
    <Screen variant="hero" scroll>
      <DecorativeHero safeTop>
        <View className="px-5 pb-12 pt-3">
            <Text className="text-3xl font-extrabold text-white">{t(language, "postRide")}</Text>
            <Text className="mt-2 text-teal-100">₹150 cancellation bond</Text>
          </View>
        </DecorativeHero>

        <View style={cardShadow} className="-mt-8 mx-4 rounded-[28px] bg-white p-4">
          <View className="mb-3 flex-row rounded-2xl bg-[#F4F7F6] p-1">
            {(["intracity", "intercity"] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setTripType(option)}
                className={`flex-1 items-center rounded-xl py-2.5 ${tripType === option ? "bg-white" : ""}`}
                style={tripType === option ? cardShadow : undefined}
              >
                <Text className={`text-sm font-bold ${tripType === option ? "text-brand" : "text-slate-500"}`}>
                  {t(language, option)}
                </Text>
              </Pressable>
            ))}
          </View>
          <PlaceField
            icon="radio-button-on-outline"
            label={t(language, "from")}
            place={originPlace}
            placeholder={t(language, "leavingFrom")}
            language={language}
            onSelect={setOriginPlace}
          />
          <PlaceField
            icon="location"
            label={t(language, "to")}
            place={destinationPlace}
            placeholder={t(language, "goingTo")}
            language={language}
            onSelect={setDestinationPlace}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <IconPickerField
                icon="calendar-outline"
                label={t(language, "date")}
                displayValue={formatDateDisplay(departureAt)}
                onPress={() => setShowDatePicker(true)}
              />
            </View>
            <View className="w-36">
              <IconPickerField
                icon="time-outline"
                label="Time"
                displayValue={formatTimeDisplay(departureAt)}
                onPress={() => setShowTimePicker(true)}
              />
            </View>
          </View>
          {showDatePicker ? (
            <DateTimePicker
              value={departureAt}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onChangeDate}
            />
          ) : null}
          {showTimePicker ? (
            <DateTimePicker
              value={departureAt}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeTime}
            />
          ) : null}
          {Platform.OS === "ios" && (showDatePicker || showTimePicker) ? (
            <View className="mb-3">
              <PrimaryButton
                label={t(language, "done")}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              />
            </View>
          ) : null}
          {vehicleSaved ? (
            <Pressable
              onPress={() => navigateRoot(navigation, "Vehicle")}
              className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-[#F7FAF9] px-3 py-3.5"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-light">
                <Ionicons name={vehicleType === "bike" ? "bicycle" : "car-sport"} size={16} color="#0F766E" />
              </View>
              <View className="ml-2 flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t(language, "vehicleReady")}
                </Text>
                <Text className="text-[16px] font-semibold text-slate-900">{vehicleNumber}</Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {vehicleType === "bike" ? t(language, "vehicleBike") : t(language, "vehicleCar")}
                </Text>
              </View>
              <Text className="text-sm font-bold text-brand">{t(language, "changeVehicle")}</Text>
            </Pressable>
          ) : (
            <>
              <View className="mb-3 flex-row rounded-2xl bg-[#F4F7F6] p-1">
                {(["car", "bike"] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onSelectVehicleType(option)}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${vehicleType === option ? "bg-white" : ""}`}
                    style={vehicleType === option ? cardShadow : undefined}
                  >
                    <Ionicons
                      name={option === "car" ? "car-sport" : "bicycle"}
                      size={16}
                      color={vehicleType === option ? "#0F766E" : "#94A3B8"}
                    />
                    <Text className={`text-sm font-bold ${vehicleType === option ? "text-brand" : "text-slate-500"}`}>
                      {option === "car" ? t(language, "vehicleCar") : t(language, "vehicleBike")}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <IconField
                icon="pricetag-outline"
                label={t(language, "vehicleNumber")}
                value={vehicleNumber}
                onChange={setVehicleNumber}
                placeholder="TN09AB1234"
              />
              <Pressable onPress={() => navigateRoot(navigation, "Vehicle")} className="mb-3 -mt-1">
                <Text className="text-xs font-semibold text-brand">{t(language, "addVehicleFirst")}</Text>
              </Pressable>
            </>
          )}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <IconField
                icon="cash-outline"
                label="₹ / seat"
                value={price}
                onChange={setPrice}
                keyboard="numeric"
                placeholder="500"
              />
            </View>
            <View className="w-28">
              <IconField
                icon="people-outline"
                label={t(language, "seats")}
                value={seats}
                onChange={setSeats}
                keyboard="numeric"
                editable={vehicleType !== "bike"}
                placeholder="1"
              />
            </View>
          </View>
          {suggestedPrice !== null && distanceKm !== null ? (
            <Pressable
              onPress={() => setPrice(String(suggestedPrice))}
              className="mb-1 mt-[-6px] flex-row items-center justify-between rounded-2xl bg-brand-light px-3 py-2.5"
            >
              <Text className="text-xs font-semibold text-brand">
                {distanceKm.toFixed(0)} km · {t(language, "suggestedPrice")} ₹{suggestedPrice}
              </Text>
              <Text className="text-xs font-extrabold text-brand">{t(language, "usePrice")}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setWomenOnly((value) => !value)}
            className={`mt-1 flex-row items-center rounded-2xl px-3 py-3.5 ${womenOnly ? "bg-pink-50" : "bg-[#F7FAF9]"}`}
          >
            <Ionicons name={womenOnly ? "checkmark-circle" : "ellipse-outline"} size={22} color={womenOnly ? "#BE185D" : "#94A3B8"} />
            <Text className={`ml-2 font-bold ${womenOnly ? "text-pink-700" : "text-slate-600"}`}>
              {t(language, "womenOnly")}
            </Text>
          </Pressable>
          <View className="mt-2 rounded-2xl bg-[#F7FAF9] px-3 py-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-bold text-slate-700">
                  {instantBook ? t(language, "instantBook") : t(language, "requestToBook")}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {instantBook ? t(language, "instantBookHint") : t(language, "requestToBookHint")}
                </Text>
              </View>
              <Pressable
                onPress={() => setInstantBook((value) => !value)}
                className={`h-7 w-12 justify-center rounded-full px-0.5 ${instantBook ? "bg-brand" : "bg-slate-300"}`}
              >
                <View
                  className="h-6 w-6 rounded-full bg-white"
                  style={{ transform: [{ translateX: instantBook ? 20 : 0 }] }}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {!canDrive ? (
          <View className="mx-5 mt-4 flex-row rounded-2xl bg-amber-50 p-3">
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <Text className="ml-2 flex-1 text-sm text-amber-800">
              Complete DL + Aadhaar + face match before publishing a ride.
            </Text>
          </View>
        ) : null}
        {canDrive && !hasActivePlan ? (
          <Pressable
            onPress={() => navigateRoot(navigation, "Plans")}
            className="mx-5 mt-4 flex-row items-center rounded-2xl bg-amber-50 p-3"
          >
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <Text className="ml-2 flex-1 text-sm text-amber-800">
              {tripType === "intercity" ? t(language, "needsOutstationPlan") : t(language, "needsLocalPlan")}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </Pressable>
        ) : null}
        {error ? <Text className="mx-5 mt-2 text-sos">{error}</Text> : null}

        <View className="mx-4 mt-5">
          <PrimaryButton disabled={!canDrive || !hasActivePlan || !originPlace || !destinationPlace} label={t(language, "postRide")} onPress={() => void submit()} />
        </View>
    </Screen>
  );
}
