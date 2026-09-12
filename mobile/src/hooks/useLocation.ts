import { useEffect } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useLocationStore } from "../store/locationStore";

// Defined at module scope (not inside the hook) because Expo re-launches this
// task from a headless JS context when the app is backgrounded/killed — there
// is no component tree to close over, only the task name and the store.
export const BACKGROUND_LOCATION_TASK = "rideshare-background-location";

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("Background location task error", error);
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) {
    return;
  }
  useLocationStore
    .getState()
    .setCoords(
      latest.coords.latitude,
      latest.coords.longitude,
      latest.coords.heading ?? undefined,
      latest.coords.speed ? latest.coords.speed * 3.6 : undefined
    );
});

export function useLocation(active: boolean) {
  const setCoords = useLocationStore((state) => state.setCoords);

  useEffect(() => {
    if (!active) {
      return;
    }
    let watchSubscription: Location.LocationSubscription | undefined;
    let usingBackgroundTask = false;
    // The permission/start sequence below is several awaits deep. If the
    // component unmounts mid-sequence (e.g. a fast screen change), the effect
    // cleanup below would otherwise run against locals that haven't been set
    // yet, and the in-flight async closure would go on to start tracking with
    // nothing left able to stop it. Every await is followed by a check of this
    // flag so a late unmount is caught and torn down as soon as control returns.
    let cancelled = false;

    (async () => {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (cancelled || !foreground.granted) {
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (cancelled) {
        return;
      }
      setCoords(
        current.coords.latitude,
        current.coords.longitude,
        current.coords.heading ?? undefined,
        current.coords.speed ? current.coords.speed * 3.6 : undefined
      );

      // Background tracking is what makes the "driver broadcasts every 5s"
      // safety promise hold once the screen locks or the app is backgrounded
      // mid-trip. It requires the separate background permission (Android 10+
      // shows this as a second "Allow all the time" prompt).
      const background = await Location.requestBackgroundPermissionsAsync();
      if (cancelled) {
        return;
      }
      if (background.granted) {
        const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(
          () => false
        );
        if (cancelled) {
          return;
        }
        if (!alreadyStarted) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 15,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "RideShare India",
              notificationBody: "Sharing your live location for this trip",
            },
          });
          if (cancelled) {
            // Cleanup ran while this awaited — nothing else will stop it now.
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch((error: unknown) =>
              console.warn("Failed to stop background location started after unmount", error)
            );
            return;
          }
        }
        usingBackgroundTask = true;
        return;
      }

      // No background permission granted — degrade to foreground-only tracking
      // rather than not tracking at all.
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 15 },
        (update) => {
          setCoords(
            update.coords.latitude,
            update.coords.longitude,
            update.coords.heading ?? undefined,
            update.coords.speed ? update.coords.speed * 3.6 : undefined
          );
        }
      );
      if (cancelled) {
        subscription.remove();
        return;
      }
      watchSubscription = subscription;
    })().catch((error: unknown) => {
      console.warn("Location watch failed", error);
    });

    return () => {
      cancelled = true;
      watchSubscription?.remove();
      if (usingBackgroundTask) {
        Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
          .then(async (started) => {
            if (started) {
              await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            }
          })
          .catch((error: unknown) => console.warn("Failed to stop background location", error));
      }
    };
  }, [active, setCoords]);
}
