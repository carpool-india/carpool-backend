import Constants from "expo-constants";
import { INDIAN_CITIES } from "@rideshare/utils";
import { bookingGet } from "./api";

export interface MapPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  state?: string | null;
}

export interface PlacePrediction {
  placeId: string;
  primary: string;
  secondary: string;
}

interface AddressComponent {
  long_name?: string;
  longText?: string;
  types?: string[];
}

function extraMapsKey(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  return (
    extra.googleMapsApiKey ||
    extra.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  ).trim();
}

export function hasMapsApiKey(): boolean {
  return extraMapsKey().length > 20;
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stateFromComponents(components: AddressComponent[] | undefined): string | null {
  const state = components?.find((item) => item.types?.includes("administrative_area_level_1"));
  return state?.longText || state?.long_name || null;
}

export function isBareCoordinateLabel(value: string): boolean {
  const trimmed = value.trim();
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(trimmed) || /\b\d{2,}[A-Z]{2}\+[A-Z0-9]{2,}\b/i.test(trimmed);
}

function componentName(components: AddressComponent[] | undefined, types: string[]): string | null {
  const match = components?.find((item) => types.some((type) => item.types?.includes(type)));
  return match?.longText || match?.long_name || null;
}

function humanPlaceName(result: {
  formatted_address?: string;
  formattedAddress?: string;
  address_components?: AddressComponent[];
  addressComponents?: AddressComponent[];
}): string | null {
  const components = result.address_components || result.addressComponents;
  const formatted = result.formatted_address || result.formattedAddress || "";
  const street = [componentName(components, ["street_number"]), componentName(components, ["route"])]
    .filter(Boolean)
    .join(" ");
  const name =
    componentName(components, ["point_of_interest", "establishment", "premise", "airport", "transit_station"]) ||
    (street || null) ||
    componentName(components, [
      "neighborhood",
      "sublocality_level_3",
      "sublocality_level_2",
      "sublocality_level_1",
      "sublocality",
    ]) ||
    componentName(components, ["locality", "postal_town", "administrative_area_level_3"]) ||
    formatted.split(",")[0] ||
    null;
  if (!name || isBareCoordinateLabel(name)) {
    return componentName(components, ["locality", "administrative_area_level_2"]) || null;
  }
  return name;
}

function pickGeocodeResult<T extends { types?: string[] }>(results: T[]): T | undefined {
  const preferred = [
    "street_address",
    "premise",
    "subpremise",
    "route",
    "neighborhood",
    "sublocality_level_1",
    "sublocality",
    "locality",
  ];
  for (const type of preferred) {
    const match = results.find((item) => item.types?.includes(type));
    if (match) {
      return match;
    }
  }
  return results.find((item) => !item.types?.includes("plus_code")) ?? results[0];
}

function localPredictions(query: string): PlacePrediction[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }
  return Object.entries(INDIAN_CITIES)
    .filter(([name]) => name.startsWith(q) || name.includes(q))
    .slice(0, 5)
    .map(([name, coord]) => ({
      placeId: `local:${name}`,
      primary: titleCase(name),
      secondary: coord.state,
    }));
}

function localPlace(placeId: string): MapPlace | null {
  if (!placeId.startsWith("local:")) {
    return null;
  }
  const key = placeId.slice("local:".length);
  const city = INDIAN_CITIES[key];
  if (!city) {
    return null;
  }
  const name = titleCase(key);
  return { placeId, name, address: `${name}, ${city.state}, India`, lat: city.lat, lng: city.lng, state: city.state };
}

async function googleGet<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function googlePost<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function suggestPlacesNew(
  key: string,
  query: string,
  language: string,
  sessionToken: string,
  bias?: { lat: number; lng: number }
): Promise<PlacePrediction[]> {
  const body: Record<string, unknown> = {
    input: query,
    includedRegionCodes: ["in"],
    languageCode: language,
    sessionToken,
  };
  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: 80000,
      },
    };
  }
  const payload = await googlePost<{
    error?: { message?: string; status?: string };
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
        text?: { text?: string };
      };
    }>;
  }>("https://places.googleapis.com/v1/places:autocomplete", body, { "X-Goog-Api-Key": key });
  if (!payload?.suggestions?.length) {
    if (payload?.error?.message && __DEV__) {
      console.warn("Places API (New) autocomplete", payload.error.status, payload.error.message);
    }
    return [];
  }
  return payload.suggestions
    .map((item) => item.placePrediction)
    .filter((item): item is NonNullable<typeof item> => Boolean(item?.placeId))
    .slice(0, 8)
    .map((item) => ({
      placeId: item.placeId as string,
      primary: item.structuredFormat?.mainText?.text || item.text?.text || query,
      secondary: item.structuredFormat?.secondaryText?.text || "",
    }));
}

async function suggestPlacesLegacy(key: string, query: string, language: string, sessionToken: string): Promise<PlacePrediction[]> {
  const params = new URLSearchParams({
    input: query,
    key,
    components: "country:in",
    language,
    sessiontoken: sessionToken,
  });
  const payload = await googleGet<{
    status?: string;
    error_message?: string;
    predictions?: Array<{
      place_id: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
      description?: string;
    }>;
  }>(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
  if (payload?.status !== "OK" || !payload.predictions?.length) {
    if (payload?.status && payload.status !== "ZERO_RESULTS" && __DEV__) {
      console.warn("Places autocomplete", payload.status, payload.error_message);
    }
    return [];
  }
  return payload.predictions.slice(0, 8).map((item) => ({
    placeId: item.place_id,
    primary: item.structured_formatting?.main_text || item.description || query,
    secondary: item.structured_formatting?.secondary_text || "",
  }));
}

export async function suggestPlaces(
  query: string,
  options: { language?: string; sessionToken?: string; bias?: { lat: number; lng: number } } = {}
): Promise<PlacePrediction[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const language = options.language ?? "en";
  const sessionToken = options.sessionToken ?? `${Date.now()}`;
  const key = extraMapsKey();
  if (key) {
    const fromNew = await suggestPlacesNew(key, q, language, sessionToken, options.bias);
    if (fromNew.length) {
      return fromNew;
    }
    const fromLegacy = await suggestPlacesLegacy(key, q, language, sessionToken);
    if (fromLegacy.length) {
      return fromLegacy;
    }
  }
  try {
    const payload = await bookingGet<{
      suggestions: Array<{ placeId: string; description: string; primary?: string; secondary?: string }>;
    }>(`/geo/suggest?q=${encodeURIComponent(q)}`);
    if (payload.suggestions?.length) {
      return payload.suggestions.map((item) => ({
        placeId: item.placeId,
        primary: item.primary || item.description.split(",")[0] || item.description,
        secondary: item.secondary || item.description.split(",").slice(1).join(",").trim(),
      }));
    }
  } catch {
    // Device may not reach booking; city fallback still helps known metros.
  }
  return localPredictions(q);
}

async function detailsNew(key: string, placeId: string, language: string, sessionToken: string): Promise<MapPlace | null> {
  const id = placeId.replace(/^places\//, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      signal: controller.signal,
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,shortFormattedAddress,location,addressComponents",
        "X-Goog-Session-Token": sessionToken,
      },
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      shortFormattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      addressComponents?: AddressComponent[];
    };
    if (!response.ok || payload.location?.latitude == null || payload.location.longitude == null) {
      if (payload.error?.message && __DEV__) {
        console.warn("Places details (New)", payload.error.message);
      }
      return null;
    }
    const name = payload.displayName?.text || payload.shortFormattedAddress || payload.formattedAddress || "Selected place";
    return {
      placeId: payload.id || id,
      name,
      address: payload.formattedAddress || name,
      lat: payload.location.latitude,
      lng: payload.location.longitude,
      state: stateFromComponents(payload.addressComponents),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function detailsLegacy(key: string, placeId: string, language: string, sessionToken: string): Promise<MapPlace | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    key,
    language,
    sessiontoken: sessionToken,
    fields: "geometry,formatted_address,name,address_component",
  });
  const payload = await googleGet<{
    status?: string;
    result?: {
      name?: string;
      formatted_address?: string;
      geometry?: { location?: { lat: number; lng: number } };
      address_components?: AddressComponent[];
    };
  }>(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
  const location = payload?.result?.geometry?.location;
  if (payload?.status !== "OK" || !location) {
    return null;
  }
  const name = payload.result?.name || payload.result?.formatted_address || "Selected place";
  return {
    placeId,
    name,
    address: payload.result?.formatted_address || name,
    lat: location.lat,
    lng: location.lng,
    state: stateFromComponents(payload.result?.address_components),
  };
}

export async function resolvePlace(
  placeId: string,
  options: { language?: string; sessionToken?: string } = {}
): Promise<MapPlace> {
  const local = localPlace(placeId);
  if (local) {
    return local;
  }
  const language = options.language ?? "en";
  const sessionToken = options.sessionToken ?? `${Date.now()}`;
  const key = extraMapsKey();
  if (key) {
    const fromNew = await detailsNew(key, placeId, language, sessionToken);
    if (fromNew) {
      return fromNew;
    }
    const fromLegacy = await detailsLegacy(key, placeId, language, sessionToken);
    if (fromLegacy) {
      return fromLegacy;
    }
  }
  const payload = await bookingGet<{ place: MapPlace & { name: string } }>(
    `/geo/place?placeId=${encodeURIComponent(placeId)}`
  );
  return {
    ...payload.place,
    address: payload.place.address || payload.place.name,
  };
}

export async function geocodePlace(
  query: string,
  options: { language?: string } = {}
): Promise<MapPlace> {
  const q = query.trim();
  const key = extraMapsKey();
  if (key) {
    const params = new URLSearchParams({
      address: q,
      key,
      region: "in",
      components: "country:IN",
      language: options.language ?? "en",
    });
    const payload = await googleGet<{
      status?: string;
      results?: Array<{
        place_id?: string;
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
        address_components?: AddressComponent[];
      }>;
    }>(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    const result = payload?.results?.[0];
    const location = result?.geometry?.location;
    if (payload?.status === "OK" && location) {
      const address = result.formatted_address || q;
      return {
        placeId: result.place_id || `geocode:${q.toLowerCase()}`,
        name: address.split(",")[0] || q,
        address,
        lat: location.lat,
        lng: location.lng,
        state: stateFromComponents(result.address_components),
      };
    }
  }
  try {
    const payload = await bookingGet<{ place: MapPlace }>(`/geo/geocode?q=${encodeURIComponent(q)}`);
    return { ...payload.place, address: payload.place.address || payload.place.name };
  } catch {
    const city = INDIAN_CITIES[q.toLowerCase()];
    if (city) {
      return localPlace(`local:${q.toLowerCase()}`) as MapPlace;
    }
    throw new Error(`Could not find "${q}" in India`);
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  options: { language?: string } = {}
): Promise<MapPlace | null> {
  const language = options.language ?? "en";
  const key = extraMapsKey();
  if (key) {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key,
      language,
    });
    const payload = await googleGet<{
      status?: string;
      error_message?: string;
      plus_code?: { compound_code?: string };
      results?: Array<{
        place_id?: string;
        types?: string[];
        formatted_address?: string;
        address_components?: AddressComponent[];
      }>;
    }>(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    const result = payload?.results?.length ? pickGeocodeResult(payload.results) : undefined;
    const name = result ? humanPlaceName(result) : null;
    if (payload?.status === "OK" && result && name) {
      return {
        placeId: result.place_id || `pin:${lat.toFixed(5)},${lng.toFixed(5)}`,
        name,
        address: result.formatted_address || name,
        lat,
        lng,
        state: stateFromComponents(result.address_components),
      };
    }
    if (payload?.status && payload.status !== "OK" && __DEV__) {
      console.warn("Reverse geocode", payload.status, payload.error_message);
    }

    try {
      const response = await fetch(
        `https://geocode.googleapis.com/v4beta/geocode/location/${lat},${lng}?languageCode=${encodeURIComponent(language)}`,
        { headers: { "X-Goog-Api-Key": key } }
      );
      const newer = (await response.json()) as {
        results?: Array<{
          formattedAddress?: string;
          types?: string[];
          addressComponents?: AddressComponent[];
        }>;
      };
      const next = newer.results?.length ? pickGeocodeResult(newer.results) : undefined;
      const nextName = next ? humanPlaceName(next) : null;
      if (next && nextName) {
        return {
          placeId: `pin:${lat.toFixed(5)},${lng.toFixed(5)}`,
          name: nextName,
          address: next.formattedAddress || nextName,
          lat,
          lng,
          state: stateFromComponents(next.addressComponents),
        };
      }
    } catch {
      // Fall through to booking.
    }
  }

  try {
    const payload = await bookingGet<{ place: MapPlace }>(`/geo/reverse?lat=${lat}&lng=${lng}`);
    if (payload.place?.name && !isBareCoordinateLabel(payload.place.name)) {
      return { ...payload.place, address: payload.place.address || payload.place.name };
    }
  } catch {
    // Keep the previously selected place name in the picker instead of showing coordinates.
  }
  return null;
}
