import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentGet, paymentPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_SUBSCRIPTIONS, paginate } from "../lib/mockData";

interface AdminSubscription {
  id: string;
  plan_type: string;
  cadence: string;
  amount_inr: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  users: { name: string | null; phone: string } | null;
}

const STATUS_TONE: Record<string, "good" | "warn" | "critical" | "neutral"> = {
  active: "good",
  pending: "warn",
  expired: "neutral",
  cancelled: "critical",
};

export function SubscriptionsScreen() {
  const [page, setPage] = useState(1);
  const [planType, setPlanType] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-subscriptions", page, planType, status],
    queryFn: () => {
      const filtered = MOCK_SUBSCRIPTIONS.filter(
        (sub) => (!planType || sub.plan_type === planType) && (!status || sub.status === status)
      );
      return liveOrMock(
        () =>
          paymentGet<{ items: AdminSubscription[]; total: number }>(
            `/admin/subscriptions?page=${page}&limit=20${planType ? `&planType=${planType}` : ""}${
              status ? `&status=${status}` : ""
            }`
          ),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function cancel(sub: AdminSubscription) {
    if (!window.confirm("Cancel this plan?")) {
      return;
    }
    setNotice(null);
    try {
      await paymentPatch(`/admin/subscriptions/${sub.id}/cancel`, {});
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to cancel plan");
    }
    queryClient.setQueryData<{ items: AdminSubscription[]; total: number }>(
      ["admin-subscriptions", page, planType, status],
      (old) =>
        old ? { ...old, items: old.items.map((item) => (item.id === sub.id ? { ...item, status: "cancelled" } : item)) } : old
    );
  }

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <select
          value={planType}
          onChange={(e) => {
            setPage(1);
            setPlanType(e.target.value);
          }}
        >
          <option value="">All plans</option>
          <option value="driver_local">Local driver</option>
          <option value="driver_outstation">Outstation driver</option>
          <option value="passenger">Passenger</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "User",
            render: (sub) => (
              <>
                {sub.users?.name ?? "—"} <span className="muted">{sub.users?.phone}</span>
              </>
            ),
          },
          { header: "Plan", render: (sub) => <Badge label={sub.plan_type} tone="neutral" /> },
          { header: "Cadence", render: (sub) => sub.cadence },
          { header: "Amount", render: (sub) => `₹${sub.amount_inr}` },
          { header: "Status", render: (sub) => <Badge label={sub.status} tone={STATUS_TONE[sub.status] ?? "neutral"} /> },
          {
            header: "Expires",
            render: (sub) => (sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("en-IN") : "—"),
          },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (sub) =>
              sub.status === "cancelled" || sub.status === "expired" ? null : (
                <ActionMenu items={[{ label: "Cancel", onSelect: () => void cancel(sub) }]} />
              ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(sub) => sub.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load plans" : null}
        emptyTitle="No plans yet"
        emptyHint="Driver and passenger subscriptions will appear in this table when purchased."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
