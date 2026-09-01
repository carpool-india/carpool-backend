import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { haversineKm } from "@rideshare/utils";
import { t, type AppLanguage } from "../../i18n/translations";
import {
  hasMapsApiKey,
  isBareCoordinateLabel,
  resolvePlace,
  reverseGeocode,
  suggestPlaces,
  type MapPlace,
  type PlacePrediction,
} from "../../services/places";
import { useTripStore } from "../../store/tripStore";
import { PrimaryButton } from "./PrimaryButton";
import { containedScrollProps } from "./containedScroll";

function newSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function PlacePicker({
  visible,
  title,
  language,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  language: AppLanguage;
  onClose: () => void;
  onConfirm: (place: MapPlace) => void;
}) {
  const recentPlaces = useTripStore((state) => state.recentPlaces);
  const addRecentPlace = useTripStore((state) => state.addRecentPlace);
  const [step, setStep] = useState<"search" | "pin">("search");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapPlace | null>(null);
  const sessionToken = useRef(newSessionToken());
  const regionRef = useRef<Region | null>(null);
  const selectedRef = useRef<MapPlace | null>(null);
  const reverseSeq = useRef(0);

  useEffect(() => {
    if (!visible) {
      return;
    }
    sessionToken.current = newSessionToken();
    setStep("search");
    setQuery("");
    setPredictions([]);
    setError(null);
    setDraft(null);
    setLoading(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== "search") {
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }
    const handle = setTimeout(() => {
      setLoading(true);
      void suggestPlaces(q, { language, sessionToken: sessionToken.current })
        .then((items) => setPredictions(items))
        .catch(() => setPredictions([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(handle);
  }, [query, visible, step, language]);

  function finish(place: MapPlace) {
    selectedRef.current = place;
    addRecentPlace(place);
    onConfirm(place);
  }

  async function openPin(place: MapPlace) {
    selectedRef.current = place;
    setDraft(place);
    regionRef.current = {
      latitude: place.lat,
      longitude: place.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setStep("pin");
  }

  async function pickPrediction(item: PlacePrediction) {
    setError(null);
    setLoading(true);
    try {
      const place = await resolvePlace(item.placeId, { language, sessionToken: sessionToken.current });
      finish(place);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, "noPlaces"));
    } finally {
      setLoading(false);
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError(t(language, "locationDenied"));
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const place = await reverseGeocode(current.coords.latitude, current.coords.longitude, { language });
      finish(
        place ?? {
          placeId: `pin:${current.coords.latitude.toFixed(5)},${current.coords.longitude.toFixed(5)}`,
          name: t(language, "useCurrentLocation"),
          address: t(language, "adjustPin"),
          lat: current.coords.latitude,
          lng: current.coords.longitude,
          state: null,
        }
      );
    } catch {
      setError(t(language, "locationDenied"));
    } finally {
      setLocating(false);
    }
  }

  async function chooseOnMap() {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      let lat = 12.9716;
      let lng = 77.5946;
      if (permission.granted) {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = current.coords.latitude;
        lng = current.coords.longitude;
      }
      const place = await reverseGeocode(lat, lng, { language });
      await openPin(
        place ?? {
          placeId: `map:${lat.toFixed(5)},${lng.toFixed(5)}`,
          name: t(language, "chooseOnMap"),
          address: t(language, "adjustPin"),
          lat,
          lng,
          state: null,
        }
      );
    } catch {
      await openPin({
        placeId: "map:india",
        name: t(language, "chooseOnMap"),
        address: t(language, "adjustPin"),
        lat: 12.9716,
        lng: 77.5946,
        state: null,
      });
    } finally {
      setLocating(false);
    }
  }

  async function onRegionChangeComplete(region: Region) {
    regionRef.current = region;
    const origin = selectedRef.current;
    if (origin && haversineKm(origin.lat, origin.lng, region.latitude, region.longitude) < 0.045) {
      setDraft({ ...origin, lat: region.latitude, lng: region.longitude });
      return;
    }
    const seq = ++reverseSeq.current;
    const place = await reverseGeocode(region.latitude, region.longitude, { language });
    if (seq !== reverseSeq.current) {
      return;
    }
    if (place && !isBareCoordinateLabel(place.name)) {
      setDraft(place);
      return;
    }
    setDraft((current) =>
      current
        ? { ...current, lat: region.latitude, lng: region.longitude }
        : current
    );
  }

  function confirmPin() {
    if (!draft) {
      return;
    }
    const region = regionRef.current;
    const named =
      draft.name && !isBareCoordinateLabel(draft.name) ? draft : selectedRef.current ?? draft;
    const place: MapPlace = {
      ...named,
      lat: region?.latitude ?? draft.lat,
      lng: region?.longitude ?? draft.lng,
      address:
        named.address && !isBareCoordinateLabel(named.address) ? named.address : named.name,
    };
    addRecentPlace(place);
    onConfirm(place);
  }

  const emptyQuery = query.trim().length < 2;
  const rows: Array<PlacePrediction & { saved?: MapPlace }> = emptyQuery
    ? recentPlaces.map((place) => ({
        placeId: place.placeId,
        primary: place.name,
        secondary: place.address,
        saved: place,
      }))
    : predictions;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : "fullScreen"}
      transparent={Platform.OS === "ios"}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]} style={{ overflow: "hidden" }}>
        {step === "search" ? (
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className="flex-row items-center px-3 pb-2 pt-1">
              <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F4F7F6]">
                <Ionicons name="chevron-back" size={22} color="#0F766E" />
              </Pressable>
              <Text className="ml-3 flex-1 text-lg font-extrabold text-slate-900">{title}</Text>
            </View>
            <View className="mx-4 mb-3 flex-row items-center rounded-2xl bg-[#F4F7F6] px-3">
              <Ionicons name="search" size={18} color="#0F766E" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t(language, "placeSearchPlaceholder")}
                placeholderTextColor="#94A3B8"
                autoFocus
                autoCorrect={false}
                textAlignVertical="center"
                style={{ includeFontPadding: false }}
                className="ml-2 flex-1 py-3.5 text-[16px] font-semibold text-slate-900"
              />
              {query ? (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>
            {!hasMapsApiKey() ? (
              <Text className="mx-4 mb-2 text-xs font-medium text-amber-700">{t(language, "mapsKeyMissing")}</Text>
            ) : null}
            {error ? <Text className="mx-4 mb-2 text-sm font-medium text-sos">{error}</Text> : null}
            <Pressable onPress={() => void useCurrentLocation()} className="mx-4 mb-1 flex-row items-center rounded-2xl px-2 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light">
                {locating ? <ActivityIndicator color="#0F766E" /> : <Ionicons name="navigate" size={18} color="#0F766E" />}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-slate-900">{t(language, "useCurrentLocation")}</Text>
                <Text className="mt-0.5 text-xs text-slate-500">{t(language, "locatingHint")}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => void chooseOnMap()} className="mx-4 mb-2 flex-row items-center rounded-2xl px-2 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light">
                <Ionicons name="map" size={18} color="#0F766E" />
              </View>
              <Text className="ml-3 text-[15px] font-bold text-slate-900">{t(language, "chooseOnMap")}</Text>
            </Pressable>
            {loading ? <ActivityIndicator color="#0F766E" className="my-2" /> : null}
            <FlatList
              {...containedScrollProps}
              data={rows}
              keyExtractor={(item) => item.placeId}
              ListHeaderComponent={
                emptyQuery && recentPlaces.length ? (
                  <Text className="mx-4 mb-1 mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t(language, "recentPlaces")}
                  </Text>
                ) : null
              }
              ListEmptyComponent={
                !loading && query.trim().length >= 2 ? (
                  <Text className="mx-4 mt-6 text-center text-sm text-slate-500">{t(language, "noPlaces")}</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if ("saved" in item && item.saved) {
                      finish(item.saved);
                      return;
                    }
                    void pickPrediction(item);
                  }}
                  className="mx-4 flex-row items-start border-b border-slate-100 py-3.5"
                >
                  <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-[#F4F7F6]">
                    <Ionicons name="location-outline" size={16} color="#0F766E" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-bold text-slate-900">{item.primary}</Text>
                    {item.secondary ? (
                      <Text className="mt-0.5 text-[13px] leading-5 text-slate-500" numberOfLines={2}>
                        {item.secondary}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
              ListFooterComponent={
                <Text className="mx-4 my-4 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t(language, "poweredByGoogle")}
                </Text>
              }
            />
          </KeyboardAvoidingView>
        ) : (
          <View className="flex-1">
            <View className="flex-1">
              <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                showsUserLocation
                showsMyLocationButton={false}
                initialRegion={{
                  latitude: draft?.lat ?? 12.9716,
                  longitude: draft?.lng ?? 77.5946,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onRegionChangeComplete={(region) => void onRegionChangeComplete(region)}
                onMapReady={() => {
                  if (!regionRef.current && draft) {
                    regionRef.current = {
                      latitude: draft.lat,
                      longitude: draft.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    };
                  }
                }}
              />
              <View pointerEvents="none" style={styles.pinWrap}>
                <Ionicons name="location" size={44} color="#0F766E" style={styles.pinIcon} />
              </View>
              <View className="absolute left-3 right-3 top-2 z-10 flex-row items-center">
                <Pressable
                  onPress={() => setStep("search")}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white"
                  style={styles.fab}
                >
                  <Ionicons name="chevron-back" size={22} color="#0F766E" />
                </Pressable>
              </View>
            </View>
            <View className="rounded-t-[28px] bg-white px-4 pb-6 pt-4" style={styles.sheet}>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</Text>
              <Text className="mt-1 text-lg font-extrabold text-slate-900">
                {draft && !isBareCoordinateLabel(draft.name) ? draft.name : selectedRef.current?.name ?? draft?.name}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-500">
                {draft && draft.address && !isBareCoordinateLabel(draft.address)
                  ? draft.address
                  : selectedRef.current?.address ?? draft?.address}
              </Text>
              <Text className="mt-2 text-xs font-medium text-slate-400">{t(language, "adjustPin")}</Text>
              <View className="mt-4">
                <PrimaryButton label={t(language, "confirmLocation")} onPress={confirmPin} />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pinIcon: {
    marginTop: -22,
  },
  fab: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sheet: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
});
