import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { View } from "react-native";
import { useMemo } from "react";
import { decodePolyline } from "@rideshare/utils";

interface MapPoint {
  lat: number;
  lng: number;
}

function regionFor(points: Array<{ latitude: number; longitude: number }>) {
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.04, (maxLat - minLat) * 1.8),
    longitudeDelta: Math.max(0.04, (maxLng - minLng) * 1.8),
  };
}

export function LiveMap({
  lat,
  lng,
  origin,
  destination,
  polyline,
}: {
  lat: number;
  lng: number;
  origin?: MapPoint;
  destination?: MapPoint;
  polyline?: string | null;
}) {
  const routeCoords = useMemo(() => {
    if (!polyline) {
      return [];
    }
    try {
      return decodePolyline(polyline).map((point) => ({
        latitude: point.lat,
        longitude: point.lng,
      }));
    } catch {
      return [];
    }
  }, [polyline]);

  const markers = [
    { latitude: lat, longitude: lng },
    ...(origin ? [{ latitude: origin.lat, longitude: origin.lng }] : []),
    ...(destination ? [{ latitude: destination.lat, longitude: destination.lng }] : []),
    ...routeCoords,
  ];

  return (
    <View className="overflow-hidden rounded-[28px]">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ width: "100%", height: 240 }}
        region={regionFor(markers)}
      >
        <Marker coordinate={{ latitude: lat, longitude: lng }} title="Live" pinColor="#0F766E" />
        {origin ? (
          <Marker
            coordinate={{ latitude: origin.lat, longitude: origin.lng }}
            title="Pickup"
            pinColor="#0F766E"
          />
        ) : null}
        {destination ? (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            title="Drop"
            pinColor="#DC2626"
          />
        ) : null}
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor="#0F766E" strokeWidth={4} />
        ) : null}
      </MapView>
    </View>
  );
}
