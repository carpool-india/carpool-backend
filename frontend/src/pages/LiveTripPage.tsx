import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Trip } from "@rideshare/types";
import { bookingGet } from "../services/api";
import { useRealtimeTrip } from "../hooks/useRealtimeTrip";
import { LiveMap } from "../components/LiveMap";
import { ChatPanel } from "../components/ChatPanel";
import { SosButton } from "../components/SosButton";
import { Alert, Card, EmptyState, Page, PageHeader, PrimaryButton } from "../components/ui";

export function LiveTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? undefined;
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { driverGps } = useRealtimeTrip(tripId ?? null);

  useEffect(() => {
    if (!tripId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    bookingGet<{ trip: Trip }>(`/trips/${tripId}`)
      .then((payload) => {
        if (!cancelled) {
          setTrip(payload.trip);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load this trip");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (!tripId) {
    return null;
  }

  if (loading) {
    return (
      <Page width="md">
        <div className="skeleton h-72 rounded-3xl" />
      </Page>
    );
  }

  if (error || !trip) {
    return (
      <Page width="md">
        <EmptyState
          title="Couldn't load this trip"
          body={error ?? "This trip may no longer be available."}
          action={
            <PrimaryButton type="button" onClick={() => navigate("/trips")}>
              Back to my trips
            </PrimaryButton>
          }
        />
      </Page>
    );
  }

  const liveLat = driverGps?.lat ?? trip.originPoint.lat;
  const liveLng = driverGps?.lng ?? trip.originPoint.lng;

  return (
    <Page width="md">
      <PageHeader
        kicker="Live trip"
        title={`${trip.originName} to ${trip.destinationName}`}
        subtitle={driverGps ? "Tracking the driver's live position." : "Waiting for the driver's live position…"}
      />

      {!driverGps ? (
        <div className="mb-4">
          <Alert tone="brand">Live GPS appears here once the driver starts sharing their location for this trip.</Alert>
        </div>
      ) : null}

      <Card className="p-4">
        <LiveMap
          lat={liveLat}
          lng={liveLng}
          origin={trip.originPoint}
          destination={trip.destinationPoint}
          polyline={trip.routePolyline}
        />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <ChatPanel tripId={tripId} />
        <div className="flex justify-center sm:pt-2">
          <SosButton tripId={tripId} bookingId={bookingId} />
        </div>
      </div>
    </Page>
  );
}
