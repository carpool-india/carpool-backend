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
import { PrimaryButton, GhostButton } from "../../components/ui/PrimaryButton";
import { StepProgress } from "../../components/ui/StepProgress";
import { Screen } from "../../components/ui/Screen";
import { cardShadow } from "../../theme/shadows";

const STEP_COUNT = 4;

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
  const [step, setStep] = useState(0);
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

  function validateStep(current: number): boolean {
    if (current === 0) {
      if (!originPlace || !destinationPlace) {
        setError(t(language, "selectBothPlaces"));
        return false;
      }
    } else if (current === 1) {
      const parsed = vehicleNumberSchema.safeParse(vehicleNumber);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Enter a valid vehicle number");
        return false;
      }
    } else if (current === 2) {
      if (!price || Number(price) <= 0) {
        setError(t(language, "enterFare"));
        return false;
      }
      if (!seats || Number(seats) <= 0) {
        setError(t(language, "enterSeatsCount"));
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) {
      return;
    }
    setError(null);
    setStep((value) => Math.min(value + 1, STEP_COUNT - 1));
  }

  function goBack() {
    setError(null);
    setStep((value) => Math.max(value - 1, 0));
  }

  async function submit() {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return;
    }
    const parsedVehicleNumber = vehicleNumberSchema.safeParse(vehicleNumber);
    if (!parsedVehicleNumber.success || !originPlace || !destinationPlace) {
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

  const stepTitle = [
    t(language, "postRideStepRoute"),
    t(language, "postRideStepWhen"),
    t(language, "postRideStepPrice"),
    t(language, "postRideStepReview"),
  ][step];

  return (
    <Screen variant="stacked" scroll>
      <View className="px-4 pt-4">
        <StepProgress step={step} total={STEP_COUNT} title={stepTitle} />

        {!canDrive ? (
          <View className="mt-4 flex-row rounded-2xl bg-amber-50 p-3">
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <Text className="ml-2 flex-1 text-sm text-amber-800">{t(language, "completeVerificationBanner")}</Text>
          </View>
        ) : null}
        {canDrive && !hasActivePlan ? (
          <Pressable
            onPress={() => navigateRoot(navigation, "Plans")}
            className="mt-4 flex-row items-center rounded-2xl bg-amber-50 p-3"
          >
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <Text className="ml-2 flex-1 text-sm text-amber-800">
              {tripType === "intercity" ? t(language, "needsOutstationPlan") : t(language, "needsLocalPlan")}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </Pressable>
        ) : null}

        <View style={cardShadow} className="mt-4 rounded-[28px] bg-white p-4">
          {step === 0 ? (
            <>
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
            </>
          ) : null}

          {step === 1 ? (
            <>
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
                    label={t(language, "time")}
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
                  className="mt-1 flex-row items-center rounded-2xl border border-slate-100 bg-[#F7FAF9] px-3 py-3.5"
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
                  <View className="mt-1 mb-3 flex-row rounded-2xl bg-[#F4F7F6] p-1">
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
                  <Pressable onPress={() => navigateRoot(navigation, "Vehicle")} className="-mt-1">
                    <Text className="text-xs font-semibold text-brand">{t(language, "addVehicleFirst")}</Text>
                  </Pressable>
                </>
              )}
            </>
          ) : null}

          {step === 2 ? (
            <>
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
            </>
          ) : null}

          {step === 3 ? (
            <>
              <ReviewRow icon="navigate-outline" label={t(language, "reviewRoute")} value={`${originPlace?.name ?? "—"} → ${destinationPlace?.name ?? "—"}`} />
              <ReviewRow icon="calendar-outline" label={t(language, "reviewWhen")} value={`${formatDateDisplay(departureAt)}, ${formatTimeDisplay(departureAt)}`} />
              <ReviewRow
                icon={vehicleType === "bike" ? "bicycle" : "car-sport"}
                label={t(language, "reviewVehicle")}
                value={`${vehicleNumber || "—"} · ${vehicleType === "bike" ? t(language, "vehicleBike") : t(language, "vehicleCar")}`}
              />
              <ReviewRow icon="cash-outline" label={t(language, "reviewFare")} value={price ? `₹${price}` : "—"} />
              <ReviewRow icon="people-outline" label={t(language, "reviewSeats")} value={seats || "—"} last />
              <View className="mt-3 flex-row flex-wrap gap-2">
                {womenOnly ? (
                  <View className="rounded-full bg-pink-50 px-3 py-1.5">
                    <Text className="text-xs font-bold text-pink-700">{t(language, "womenOnly")}</Text>
                  </View>
                ) : null}
                <View className="rounded-full bg-brand-light px-3 py-1.5">
                  <Text className="text-xs font-bold text-brand">
                    {instantBook ? t(language, "instantBook") : t(language, "requestToBook")}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {error ? <Text className="mx-1 mt-3 text-sos">{error}</Text> : null}

        <View className="mt-5 flex-row gap-3">
          {step > 0 ? (
            <View className="flex-1">
              <GhostButton label={t(language, "back")} onPress={goBack} />
            </View>
          ) : null}
          <View className="flex-1">
            {step < STEP_COUNT - 1 ? (
              <PrimaryButton label={t(language, "next")} onPress={goNext} />
            ) : (
              <PrimaryButton
                disabled={!canDrive || !hasActivePlan}
                label={t(language, "postRide")}
                onPress={() => void submit()}
              />
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  last,
}: {
  icon: "navigate-outline" | "calendar-outline" | "car-sport" | "bicycle" | "cash-outline" | "people-outline";
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center py-3 ${last ? "" : "border-b border-slate-100"}`}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-light">
        <Ionicons name={icon} size={16} color="#0F766E" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</Text>
        <Text className="mt-0.5 text-[15px] font-semibold text-slate-900">{value}</Text>
      </View>
    </View>
  );
}
