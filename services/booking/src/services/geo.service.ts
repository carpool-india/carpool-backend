import { INDIAN_CITIES } from "@rideshare/utils";
import { badRequest } from "../lib/errors";
import { loadEnv } from "../lib/env";

export interface GeoPlace {
  placeId: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  state: string | null;
}

export interface GeoSuggestion {
  placeId: string;
  description: string;
  primary?: string;
  secondary?: string;
  lat?: number;
  lng?: number;
  state?: string | null;
}

interface AddressComponent {
  long_name?: string;
  longText?: string;
  types?: string[];
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

function mapsKey(): string {
  return loadEnv().GOOGLE_MAPS_API_KEY.trim();
}

function localSuggestions(query: string): GeoSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return [];
  }
  return Object.entries(INDIAN_CITIES)
    .filter(([name]) => name.startsWith(q) || name.includes(q))
    .slice(0, 6)
    .map(([name, coord]) => ({
      placeId: `local:${name}`,
      description: `${titleCase(name)}, ${coord.state}`,
      primary: titleCase(name),
      secondary: coord.state,
      lat: coord.lat,
      lng: coord.lng,
      state: coord.state,
    }));
}

function localPlace(placeId: string): GeoPlace | null {
  if (!placeId.startsWith("local:")) {
    return null;
  }
  const key = placeId.slice("local:".length);
  const city = INDIAN_CITIES[key];
  if (!city) {
    return null;
  }
  const name = titleCase(key);
  return {
    placeId,
    name,
    address: `${name}, ${city.state}, India`,
    lat: city.lat,
    lng: city.lng,
    state: city.state,
  };
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

export async function suggestPlaces(query: string): Promise<GeoSuggestion[]> {
  const q = query.trim();
  const fallback = localSuggestions(q);
  const key = mapsKey();
  if (!key || q.length < 2) {
    return fallback;
  }

  try {
    const newResponse = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ["in"],
        languageCode: "en",
      }),
    });
    const newPayload = (await newResponse.json()) as {
      error?: { message?: string; status?: string };
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string;
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
          text?: { text?: string };
        };
      }>;
    };
    const fromNew = (newPayload.suggestions ?? [])
      .map((item) => item.placePrediction)
      .filter((item): item is NonNullable<typeof item> => Boolean(item?.placeId))
      .slice(0, 8)
      .map((item) => {
        const primary = item.structuredFormat?.mainText?.text || item.text?.text || q;
        const secondary = item.structuredFormat?.secondaryText?.text || "";
        return {
          placeId: item.placeId as string,
          description: secondary ? `${primary}, ${secondary}` : primary,
          primary,
          secondary,
        };
      });
    if (fromNew.length) {
      return fromNew;
    }
    if (newPayload.error?.message) {
      console.warn("Places API (New) autocomplete", newPayload.error.status, newPayload.error.message);
    }
  } catch (error) {
    console.warn("Places API (New) autocomplete failed", error);
  }

  const params = new URLSearchParams({
    input: q,
    key,
    components: "country:in",
    language: "en",
  });
  const payload = await googleGet<{
    status?: string;
    error_message?: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
    }>;
  }>(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);

  if (payload?.status === "OK" && payload.predictions?.length) {
    return payload.predictions.slice(0, 8).map((item) => ({
      placeId: item.place_id,
      description: item.description,
      primary: item.structured_formatting?.main_text || item.description,
      secondary: item.structured_formatting?.secondary_text || "",
    }));
  }
  if (payload?.status && payload.status !== "ZERO_RESULTS") {
    console.warn("Places autocomplete", payload.status, payload.error_message);
  }

  const geocoded = await geocodeQuery(q, { skipLocal: true });
  if (geocoded) {
    return [
      {
        placeId: geocoded.placeId,
        description: geocoded.address || geocoded.name,
        primary: geocoded.name,
        secondary: geocoded.address || "",
        lat: geocoded.lat,
        lng: geocoded.lng,
        state: geocoded.state,
      },
    ];
  }
  return fallback;
}

export async function placeDetails(placeId: string): Promise<GeoPlace> {
  const local = localPlace(placeId);
  if (local) {
    return local;
  }
  const key = mapsKey();
  if (!key) {
    throw badRequest("Set GOOGLE_MAPS_API_KEY to look up this place");
  }
  const id = placeId.replace(/^places\//, "");
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,shortFormattedAddress,location,addressComponents",
      },
    });
    const payload = (await response.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      shortFormattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      addressComponents?: AddressComponent[];
    };
    if (response.ok && payload.location?.latitude != null && payload.location.longitude != null) {
      const name = payload.displayName?.text || payload.shortFormattedAddress || payload.formattedAddress || "Selected place";
      return {
        placeId: payload.id || id,
        name,
        address: payload.formattedAddress || name,
        lat: payload.location.latitude,
        lng: payload.location.longitude,
        state: stateFromComponents(payload.addressComponents),
      };
    }
  } catch (error) {
    console.warn("Places details (New) failed", error);
  }

  const params = new URLSearchParams({
    place_id: id,
    key,
    fields: "geometry,formatted_address,name,address_component",
    language: "en",
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
    throw badRequest("Unable to resolve that place");
  }
  const name = payload.result?.name || payload.result?.formatted_address || "Selected place";
  return {
    placeId: id,
    name,
    address: payload.result?.formatted_address || name,
    lat: location.lat,
    lng: location.lng,
    state: stateFromComponents(payload.result?.address_components),
  };
}

export async function geocodeQuery(query: string, options: { skipLocal?: boolean } = {}): Promise<GeoPlace | null> {
  const q = query.trim();
  if (!q) {
    return null;
  }

  const key = mapsKey();
  if (key) {
    const params = new URLSearchParams({
      address: q,
      key,
      region: "in",
      components: "country:IN",
      language: "en",
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

  if (!options.skipLocal) {
    const exact = INDIAN_CITIES[q.toLowerCase()];
    if (exact) {
      return localPlace(`local:${q.toLowerCase()}`);
    }
  }
  return null;
}

export async function requireGeocode(query: string): Promise<GeoPlace> {
  const place = await geocodeQuery(query);
  if (!place) {
    throw badRequest(`Could not find "${query}" in India. Try a city, area, or landmark.`);
  }
  return place;
}

export async function reverseGeocodePlace(lat: number, lng: number): Promise<GeoPlace | null> {
  const key = mapsKey();
  if (!key) {
    return null;
  }
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key,
    language: "en",
  });
  const payload = await googleGet<{
    status?: string;
    results?: Array<{
      place_id?: string;
      types?: string[];
      formatted_address?: string;
      address_components?: AddressComponent[];
    }>;
  }>(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  const results = payload?.results ?? [];
  const preferred = ["street_address", "premise", "route", "neighborhood", "sublocality", "locality"];
  const result =
    preferred.map((type) => results.find((item) => item.types?.includes(type))).find(Boolean) ||
    results.find((item) => !item.types?.includes("plus_code")) ||
    results[0];
  if (payload?.status !== "OK" || !result?.formatted_address) {
    return null;
  }
  const components = result.address_components ?? [];
  const pick = (...types: string[]) =>
    components.find((item) => types.some((type) => item.types?.includes(type)))?.long_name ?? null;
  const street = [pick("street_number"), pick("route")].filter(Boolean).join(" ");
  const name =
    pick("point_of_interest", "establishment", "premise") ||
    street ||
    pick("neighborhood", "sublocality_level_1", "sublocality") ||
    pick("locality") ||
    result.formatted_address.split(",")[0];
  return {
    placeId: result.place_id || `pin:${lat},${lng}`,
    name,
    address: result.formatted_address,
    lat,
    lng,
    state: stateFromComponents(components),
  };
}

export async function reverseGeocodeState(point: { lat: number; lng: number }): Promise<string | null> {
  const place = await reverseGeocodePlace(point.lat, point.lng);
  return place?.state ?? null;
}
