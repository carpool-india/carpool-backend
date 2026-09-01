import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_KYC, paginate } from "../lib/mockData";

type DocType = "aadhaar" | "dl" | "selfie";
type KycStatus = "pending" | "verified" | "failed" | "rejected";

interface KycSession {
  id: string;
  user_id: string;
  document_type: DocType;
  status: KycStatus;
  storage_path: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  previewUrl?: string | null;
  users: { id: string; name: string | null; phone: string; photo_url: string | null } | null;
}

const STATUS_TONE: Record<KycStatus, "good" | "warn" | "critical" | "neutral"> = {
  pending: "warn",
  verified: "good",
  failed: "critical",
  rejected: "critical",
};

const DOC_LABEL: Record<DocType, string> = {
  aadhaar: "Aadhaar",
  dl: "Driving licence",
  selfie: "Selfie",
};

export function KycScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | KycStatus>("pending");
  const [docType, setDocType] = useState<"" | DocType>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const listKey = ["admin-kyc", page, status, docType, userId];

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => {
      const filtered = MOCK_KYC.filter((row) => {
        const statusOk = !status || row.status === status;
        const typeOk = !docType || row.document_type === docType;
        const userOk = !userId || row.user_id === userId;
        return statusOk && typeOk && userOk;
      });
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (docType) params.set("docType", docType);
      if (userId) params.set("userId", userId);
      return liveOrMock(
        () => bookingGet<{ items: KycSession[]; total: number }>(`/admin/kyc?${params.toString()}`),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  const selected = useMemo((): KycSession | null => {
    const row = query.data?.items.find((item) => item.id === selectedId) ?? MOCK_KYC.find((item) => item.id === selectedId);
    return row ? { ...row, previewUrl: "previewUrl" in row ? ((row as KycSession).previewUrl ?? null) : null } : null;
  }, [query.data?.items, selectedId]);

  const detail = useQuery({
    queryKey: ["admin-kyc-detail", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => {
      const fallback = selected ? { ...selected, previewUrl: selected.previewUrl ?? null } : null;
      if (!selectedId || !fallback) {
        return Promise.resolve(null);
      }
      return liveOrMock(
        () => bookingGet<KycSession>(`/admin/kyc/${selectedId}`),
        fallback
      );
    },
  });

  function closeReview() {
    setSelectedId(null);
    setNote("");
  }

  async function review(decision: "approve" | "reject") {
    if (!selectedId) {
      return;
    }
    setSaving(true);
    try {
      await bookingPatch(`/admin/kyc/${selectedId}`, { decision, note: note.trim() || undefined });
    } catch {
      /* keep the row updated when the API is offline */
    }
    const nextStatus: KycStatus = decision === "approve" ? "verified" : "rejected";
    queryClient.setQueryData<{ items: KycSession[]; total: number }>(listKey, (old) =>
      old
        ? {
            ...old,
            items: old.items.map((item) =>
              item.id === selectedId
                ? { ...item, status: nextStatus, reviewed_at: new Date().toISOString(), review_note: note.trim() || null }
                : item
            ),
          }
        : old
    );
    setSaving(false);
    closeReview();
  }

  const preview = detail.data ?? selected;
  const canDecide = preview?.status === "pending" || preview?.status === "failed";

  return (
    <div className="page-frame page-frame-fill">
      <FilterBar>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as typeof status);
          }}
        >
          <option value="pending">Pending review</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="failed">Failed</option>
          <option value="">All statuses</option>
        </select>
        <select
          value={docType}
          onChange={(e) => {
            setPage(1);
            setDocType(e.target.value as typeof docType);
          }}
        >
          <option value="">All documents</option>
          <option value="aadhaar">Aadhaar</option>
          <option value="dl">Driving licence</option>
          <option value="selfie">Selfie</option>
        </select>
        {userId ? (
          <button
            type="button"
            className="table-action"
            onClick={() => {
              setPage(1);
              setSearchParams({});
            }}
          >
            Clear user filter
          </button>
        ) : null}
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "User",
            render: (row) => (
              <>
                {row.users?.name ?? "—"} <span className="muted">{row.users?.phone}</span>
              </>
            ),
          },
          { header: "Document", render: (row) => DOC_LABEL[row.document_type] },
          {
            header: "Status",
            render: (row) => <Badge label={row.status} tone={STATUS_TONE[row.status]} />,
          },
          { header: "Uploaded", render: (row) => new Date(row.created_at).toLocaleString("en-IN") },
          {
            header: "Reviewed",
            render: (row) => (row.reviewed_at ? new Date(row.reviewed_at).toLocaleString("en-IN") : "—"),
          },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (row) => (
              <ActionMenu
                items={[
                  {
                    label: row.status === "pending" || row.status === "failed" ? "Review" : "View",
                    tone: "brand",
                    onSelect: () => {
                      setNote(row.review_note ?? "");
                      setSelectedId(row.id);
                    },
                  },
                ]}
              />
            ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load documents" : null}
        emptyTitle="No documents in this queue"
        emptyHint="Uploaded Aadhaar, driving licence, and selfie files appear here for admin verification."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />

      {selectedId && preview ? (
        <div className="drawer-backdrop" onClick={closeReview} role="presentation">
          <aside className="drawer-panel" onClick={(event) => event.stopPropagation()} aria-label="Document review">
            <div className="drawer-head">
              <div>
                <div className="drawer-kicker">{DOC_LABEL[preview.document_type]}</div>
                <h2>{preview.users?.name ?? "Unknown user"}</h2>
                <p>{preview.users?.phone}</p>
              </div>
              <button type="button" className="admin-signout" onClick={closeReview}>
                Close
              </button>
            </div>
            <div className="kyc-preview">
              {preview.previewUrl ? (
                <img src={preview.previewUrl} alt={`${DOC_LABEL[preview.document_type]} upload`} />
              ) : (
                <div className="kyc-preview-empty">
                  Document file is stored. Open this review on a live environment to see the photo.
                </div>
              )}
            </div>
            <div className="drawer-meta">
              <span>
                Status <Badge label={preview.status} tone={STATUS_TONE[preview.status]} />
              </span>
              <span>Uploaded {new Date(preview.created_at).toLocaleString("en-IN")}</span>
            </div>
            {preview.review_note && !canDecide ? <p className="drawer-note">{preview.review_note}</p> : null}
            {canDecide ? (
              <>
                <label className="drawer-label">
                  Review note
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional — reason if you reject"
                    rows={3}
                  />
                </label>
                <div className="drawer-actions">
                  <button type="button" className="btn-reject" disabled={saving} onClick={() => void review("reject")}>
                    Reject
                  </button>
                  <button type="button" className="btn-approve" disabled={saving} onClick={() => void review("approve")}>
                    Verify document
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
