import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_TRIPS, paginate } from "../lib/mockData";

interface AdminTrip {
  id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  trip_type: string;
  is_women_only: boolean;
  cancellation_bond_paid?: boolean;
  users: { name: string | null; phone: string } | null;
}

const STATUS_TONE: Record<string, "good" | "warn" | "critical" | "neutral" | "brand"> = {
  active: "good",
  in_progress: "brand",
  completed: "neutral",
  cancelled: "critical",
};

export function TripsScreen() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [tripType, setTripType] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-trips", page, status, tripType],
    queryFn: () => {
      const filtered = MOCK_TRIPS.filter(
        (trip) => (!status || trip.status === status) && (!tripType || trip.trip_type === tripType)
      );
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (tripType) params.set("tripType", tripType);
      return liveOrMock(
        () => bookingGet<{ items: AdminTrip[]; total: number }>(`/admin/trips?${params.toString()}`),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function cancel(trip: AdminTrip) {
    if (!window.confirm(`Cancel trip ${trip.origin_name} → ${trip.destination_name}?`)) {
      return;
    }
    setNotice(null);
    try {
      await bookingPatch(`/admin/trips/${trip.id}/cancel`, {});
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to cancel trip");
    }
    queryClient.setQueryData<{ items: AdminTrip[]; total: number }>(["admin-trips", page, status, tripType], (old) =>
      old ? { ...old, items: old.items.map((item) => (item.id === trip.id ? { ...item, status: "cancelled" } : item)) } : old
    );
  }

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={tripType}
          onChange={(e) => {
            setPage(1);
            setTripType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="intracity">Intracity</option>
          <option value="intercity">Intercity</option>
          <option value="local">Local</option>
          <option value="outstation">Outstation</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "Route",
            clip: true,
            render: (trip) => (
              <>
                {trip.origin_name} → {trip.destination_name}{" "}
                {trip.is_women_only ? <Badge label="women" tone="warn" /> : null}
              </>
            ),
          },
          { header: "Driver", render: (trip) => trip.users?.name ?? "—" },
          { header: "Departure", render: (trip) => new Date(trip.departure_time).toLocaleString("en-IN") },
          { header: "Seats", render: (trip) => `${trip.seats_available}/${trip.seats_total}` },
          { header: "Price", render: (trip) => `₹${trip.price_per_seat}` },
          { header: "Type", render: (trip) => <Badge label={trip.trip_type} tone="neutral" /> },
          { header: "Status", render: (trip) => <Badge label={trip.status} tone={STATUS_TONE[trip.status] ?? "neutral"} /> },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (trip) =>
              trip.status === "cancelled" || trip.status === "completed" ? null : (
                <ActionMenu items={[{ label: "Cancel", onSelect: () => void cancel(trip) }]} />
              ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(trip) => trip.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load trips" : null}
        emptyTitle="No trips yet"
        emptyHint="Published rides will list here with route, seats, and status."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
