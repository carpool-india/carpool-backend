import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentGet, paymentPost } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_PAYMENTS, paginate } from "../lib/mockData";

interface AdminPayment {
  id: string;
  amount: number;
  service_fee: number;
  type: string;
  status: string;
  provider: string;
  created_at: string;
  booking_id?: string | null;
  users: { name: string | null; phone: string } | null;
}

const STATUS_TONE: Record<string, "good" | "warn" | "critical" | "neutral"> = {
  captured: "good",
  created: "warn",
  authorized: "warn",
  refunded: "neutral",
  failed: "critical",
};

export function PaymentsScreen() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-payments", page, type, status],
    queryFn: () => {
      const filtered = MOCK_PAYMENTS.filter(
        (payment) => (!type || payment.type === type) && (!status || payment.status === status)
      );
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (type) params.set("type", type);
      if (status) params.set("status", status);
      return liveOrMock(
        () => paymentGet<{ items: AdminPayment[]; total: number }>(`/admin/payments?${params.toString()}`),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function refund(payment: AdminPayment) {
    if (!payment.booking_id) {
      setNotice("This payment is not linked to a booking.");
      return;
    }
    if (!window.confirm("Issue a refund for this booking?")) {
      return;
    }
    setNotice(null);
    try {
      await paymentPost("/admin/refunds", { bookingId: payment.booking_id, reason: "Admin refund" });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to refund");
    }
    queryClient.setQueryData<{ items: AdminPayment[]; total: number }>(["admin-payments", page, type, status], (old) =>
      old
        ? { ...old, items: old.items.map((item) => (item.id === payment.id ? { ...item, status: "refunded", type: "refund" } : item)) }
        : old
    );
  }

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <select
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="escrow">Platform fee</option>
          <option value="cancellation_bond">Cancellation bond</option>
          <option value="refund">Refund</option>
          <option value="payout">Payout</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="captured">Captured</option>
          <option value="created">Created</option>
          <option value="authorized">Authorized</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "Payer",
            render: (payment) => (
              <>
                {payment.users?.name ?? "—"} <span className="muted">{payment.users?.phone}</span>
              </>
            ),
          },
          { header: "Type", render: (payment) => <Badge label={payment.type === "escrow" ? "platform fee" : payment.type} tone="neutral" /> },
          { header: "Amount", render: (payment) => `₹${payment.amount}` },
          { header: "Status", render: (payment) => <Badge label={payment.status} tone={STATUS_TONE[payment.status] ?? "neutral"} /> },
          { header: "When", render: (payment) => new Date(payment.created_at).toLocaleString("en-IN") },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (payment) =>
              payment.status === "refunded" || payment.type === "refund" ? null : (
                <ActionMenu items={[{ label: "Refund", tone: "brand", onSelect: () => void refund(payment) }]} />
              ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(payment) => payment.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load payments" : null}
        emptyTitle="No payments yet"
        emptyHint="UPI captures and refunds will list here as they settle."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
