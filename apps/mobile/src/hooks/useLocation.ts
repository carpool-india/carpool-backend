import { useEffect } from "react";
import * as Location from "expo-location";
import { useLocationStore } from "../store/locationStore";

export function useLocation(active: boolean) {
  const setCoords = useLocationStore((state) => state.setCoords);

  useEffect(() => {
    if (!active) {
      return;
    }
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      await Location.requestBackgroundPermissionsAsync();
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords(
        current.coords.latitude,
        current.coords.longitude,
        current.coords.heading ?? undefined,
        current.coords.speed ? current.coords.speed * 3.6 : undefined
      );
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 15,
        },
        (update) => {
          setCoords(
            update.coords.latitude,
            update.coords.longitude,
            update.coords.heading ?? undefined,
            update.coords.speed ? update.coords.speed * 3.6 : undefined
          );
        }
      );
    })().catch((error: unknown) => {
      console.warn("Location watch failed", error);
    });
    return () => {
      subscription?.remove();
    };
  }, [active, setCoords]);
}
