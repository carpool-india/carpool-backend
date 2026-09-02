import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_REPORTS, paginate } from "../lib/mockData";

type ReportStatus = "open" | "reviewed" | "dismissed";

interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  trip_id: string | null;
  booking_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: { id: string; name: string | null; phone: string } | null;
  reported: { id: string; name: string | null; phone: string } | null;
}

const STATUS_TONE: Record<ReportStatus, "warn" | "good" | "neutral"> = {
  open: "warn",
  reviewed: "good",
  dismissed: "neutral",
};

const REASON_LABEL: Record<string, string> = {
  unsafe_driving: "Unsafe driving",
  no_show: "No-show",
  harassment: "Harassment",
  fraud_or_payment: "Fraud / payment",
  fake_profile: "Fake profile",
  other: "Other",
};

export function ReportsScreen() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | ReportStatus>("open");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const listKey = ["admin-reports", page, status];

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => {
      const filtered = MOCK_REPORTS.filter((row) => !status || row.status === status);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      return liveOrMock(
        () => bookingGet<{ items: UserReport[]; total: number }>(`/admin/reports?${params.toString()}`),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function setReportStatus(report: UserReport, next: "reviewed" | "dismissed") {
    setNotice(null);
    try {
      await bookingPatch(`/admin/reports/${report.id}`, { status: next });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update report");
    }
    queryClient.setQueryData<{ items: UserReport[]; total: number }>(listKey, (old) =>
      old ? { ...old, items: old.items.map((item) => (item.id === report.id ? { ...item, status: next } : item)) } : old
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
            setStatus(e.target.value as typeof status);
          }}
        >
          <option value="open">Open</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="">All statuses</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "Reported user",
            render: (row) => (
              <>
                {row.reported?.name ?? "—"} <span className="muted">{row.reported?.phone}</span>
              </>
            ),
          },
          {
            header: "Reported by",
            render: (row) => (
              <>
                {row.reporter?.name ?? "—"} <span className="muted">{row.reporter?.phone}</span>
              </>
            ),
          },
          { header: "Reason", render: (row) => <Badge label={REASON_LABEL[row.reason] ?? row.reason} tone="neutral" /> },
          {
            header: "Details",
            clip: true,
            render: (row) => <span title={row.details ?? undefined}>{row.details ?? "—"}</span>,
          },
          { header: "When", render: (row) => new Date(row.created_at).toLocaleString("en-IN") },
          { header: "Status", render: (row) => <Badge label={row.status} tone={STATUS_TONE[row.status]} /> },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (row) =>
              row.status === "open" ? (
                <ActionMenu
                  items={[
                    { label: "Mark reviewed", tone: "brand", onSelect: () => void setReportStatus(row, "reviewed") },
                    { label: "Dismiss", onSelect: () => void setReportStatus(row, "dismissed") },
                  ]}
                />
              ) : null,
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load reports" : null}
        emptyTitle="No reports"
        emptyHint="Reports submitted by users about other users will appear here."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
