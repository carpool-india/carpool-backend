import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { decodePolyline } from "@rideshare/utils";
import "leaflet/dist/leaflet.css";

interface MapPoint {
  lat: number;
  lng: number;
}

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const liveIcon = pinIcon("#0F766E");
const dropIcon = pinIcon("#DC2626");

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const key = points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join("|");

  useEffect(() => {
    if (points.length === 0) {
      return;
    }
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [32, 32], maxZoom: 15 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
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
  const routeCoords = useMemo<[number, number][]>(() => {
    if (!polyline) {
      return [];
    }
    try {
      return decodePolyline(polyline).map((point) => [point.lat, point.lng]);
    } catch {
      return [];
    }
  }, [polyline]);

  const boundsPoints = [{ lat, lng }, ...(origin ? [origin] : []), ...(destination ? [destination] : [])];

  return (
    <div className="overflow-hidden rounded-[28px] border border-line">
      <MapContainer center={[lat, lng]} zoom={13} style={{ width: "100%", height: 280 }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={liveIcon} />
        {origin ? <Marker position={[origin.lat, origin.lng]} icon={liveIcon} /> : null}
        {destination ? <Marker position={[destination.lat, destination.lng]} icon={dropIcon} /> : null}
        {routeCoords.length > 1 ? <Polyline positions={routeCoords} color="#0F766E" weight={4} /> : null}
        <FitBounds points={boundsPoints} />
      </MapContainer>
    </div>
  );
}
