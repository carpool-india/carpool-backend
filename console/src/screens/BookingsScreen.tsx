import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch, paymentPost } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_BOOKINGS, paginate } from "../lib/mockData";

interface AdminBooking {
  id: string;
  seats_booked: number;
  subtotal: number;
  total_amount: number;
  status: string;
  created_at: string;
  trips: { origin_name: string; destination_name: string; departure_time: string } | null;
  passenger?: { name: string | null; phone: string } | null;
}

const STATUS_TONE: Record<string, "good" | "warn" | "critical" | "neutral"> = {
  confirmed: "good",
  pending: "warn",
  completed: "neutral",
  cancelled: "critical",
};

export function BookingsScreen() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const queryKey = ["admin-bookings", page, status];
  const query = useQuery({
    queryKey,
    queryFn: () => {
      const filtered = MOCK_BOOKINGS.filter((booking) => !status || booking.status === status);
      return liveOrMock(
        () =>
          bookingGet<{ items: AdminBooking[]; total: number }>(
            `/admin/bookings?page=${page}&limit=20${status ? `&status=${status}` : ""}`
          ),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  function patchStatus(id: string, next: string) {
    queryClient.setQueryData<{ items: AdminBooking[]; total: number }>(queryKey, (old) =>
      old ? { ...old, items: old.items.map((item) => (item.id === id ? { ...item, status: next } : item)) } : old
    );
  }

  async function cancel(booking: AdminBooking) {
    if (!window.confirm("Cancel this booking?")) {
      return;
    }
    setNotice(null);
    try {
      await bookingPatch(`/admin/bookings/${booking.id}/cancel`, {});
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to cancel booking");
    }
    patchStatus(booking.id, "cancelled");
  }

  async function refund(booking: AdminBooking) {
    if (!window.confirm("Issue a refund and cancel this booking?")) {
      return;
    }
    setNotice(null);
    try {
      await paymentPost("/admin/refunds", { bookingId: booking.id, reason: "Admin refund" });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to issue refund");
    }
    patchStatus(booking.id, "cancelled");
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
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "Trip",
            clip: true,
            render: (booking) =>
              booking.trips ? `${booking.trips.origin_name} → ${booking.trips.destination_name}` : "—",
          },
          { header: "Passenger", render: (booking) => booking.passenger?.name ?? booking.passenger?.phone ?? "—" },
          { header: "Seats", render: (booking) => booking.seats_booked },
          { header: "Fare (direct)", render: (booking) => `₹${booking.subtotal}` },
          { header: "Platform fee", render: (booking) => `₹${booking.total_amount}` },
          { header: "Status", render: (booking) => <Badge label={booking.status} tone={STATUS_TONE[booking.status] ?? "neutral"} /> },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (booking) =>
              booking.status === "cancelled" || booking.status === "completed" ? null : (
                <ActionMenu
                  items={[
                    { label: "Refund", tone: "brand", onSelect: () => void refund(booking) },
                    { label: "Cancel", onSelect: () => void cancel(booking) },
                  ]}
                />
              ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(booking) => booking.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load bookings" : null}
        emptyTitle="No bookings yet"
        emptyHint="Seat bookings will appear in this table as passengers confirm rides."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
