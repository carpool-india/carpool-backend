import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionMenu } from "../components/ActionMenu";
import { ActionBanner } from "../components/ActionBanner";
import { DemoDataBanner } from "../components/DemoDataBanner";
import { liveOrMock, LiveOrMock, MOCK_KYC, paginate } from "../lib/mockData";

type DocType = "aadhaar" | "dl" | "selfie";
type KycStatus = "pending" | "verified" | "failed" | "rejected";

interface KycDocument {
  id: string;
  document_type: DocType;
  status: KycStatus;
  storage_path: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  previewUrl?: string | null;
}

interface KycUserGroup {
  user: { id: string; name: string | null; phone: string; photo_url: string | null };
  documents: KycDocument[];
}

const STATUS_TONE: Record<KycStatus, "good" | "warn" | "critical" | "neutral"> = {
  pending: "warn",
  verified: "good",
  failed: "critical",
  rejected: "critical",
};

const DOC_TYPES: DocType[] = ["aadhaar", "dl", "selfie"];

const DOC_LABEL: Record<DocType, string> = {
  aadhaar: "Aadhaar",
  dl: "Driving licence",
  selfie: "Selfie",
};

function groupFromMock(userId: string): KycUserGroup | null {
  const docs = MOCK_KYC.filter((row) => row.user_id === userId);
  if (docs.length === 0) {
    return null;
  }
  return { user: docs[0].users!, documents: docs };
}

export function KycScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFilter = searchParams.get("userId") ?? "";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | KycStatus>("pending");
  const [docType, setDocType] = useState<"" | DocType>("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const listKey = ["admin-kyc", page, status, docType, userIdFilter];

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => {
      const grouped = new Map<string, KycUserGroup>();
      for (const row of MOCK_KYC) {
        if (status && row.status !== status) continue;
        if (docType && row.document_type !== docType) continue;
        if (userIdFilter && row.user_id !== userIdFilter) continue;
        const existing = grouped.get(row.user_id);
        if (existing) {
          existing.documents.push(row);
        } else {
          grouped.set(row.user_id, { user: row.users!, documents: [row] });
        }
      }
      const mockGroups = Array.from(grouped.values());
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (docType) params.set("docType", docType);
      if (userIdFilter) params.set("userId", userIdFilter);
      return liveOrMock(
        () => bookingGet<{ items: KycUserGroup[]; total: number }>(`/admin/kyc?${params.toString()}`),
        paginate(mockGroups, page, 20)
      );
    },
  });

  const detail = useQuery({
    queryKey: ["admin-kyc-detail-user", selectedUserId],
    enabled: Boolean(selectedUserId),
    queryFn: () => {
      if (!selectedUserId) {
        return Promise.resolve({ data: null, isMock: false });
      }
      const fallback = groupFromMock(selectedUserId);
      return liveOrMock(() => bookingGet<KycUserGroup>(`/admin/kyc/user/${selectedUserId}`), fallback);
    },
  });

  function closeReview() {
    setSelectedUserId(null);
    setNotes({});
  }

  function openReview(group: KycUserGroup) {
    const initialNotes: Record<string, string> = {};
    for (const doc of group.documents) {
      initialNotes[doc.id] = doc.review_note ?? "";
    }
    setNotes(initialNotes);
    setSelectedUserId(group.user.id);
  }

  async function review(documentId: string, decision: "approve" | "reject") {
    setSavingId(documentId);
    setNotice(null);
    const note = notes[documentId]?.trim() || undefined;
    try {
      await bookingPatch(`/admin/kyc/${documentId}`, { decision, note });
    } catch (err) {
      setSavingId(null);
      setNotice(
        err instanceof Error
          ? `Could not save this decision: ${err.message}`
          : "Could not save this decision — the document is still pending."
      );
      return;
    }
    const nextStatus: KycStatus = decision === "approve" ? "verified" : "rejected";
    const patchDoc = (doc: KycDocument): KycDocument =>
      doc.id === documentId
        ? { ...doc, status: nextStatus, reviewed_at: new Date().toISOString(), review_note: note ?? null }
        : doc;
    queryClient.setQueryData<LiveOrMock<{ items: KycUserGroup[]; total: number }>>(listKey, (old) =>
      old
        ? {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((group) => ({ ...group, documents: group.documents.map(patchDoc) })),
            },
          }
        : old
    );
    queryClient.setQueryData<LiveOrMock<KycUserGroup | null>>(["admin-kyc-detail-user", selectedUserId], (old) =>
      old && old.data ? { ...old, data: { ...old.data, documents: old.data.documents.map(patchDoc) } } : old
    );
    void queryClient.invalidateQueries({ queryKey: ["admin-kyc"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    setSavingId(null);
  }

  const activeGroup = detail.data?.data;
  const isListMock = Boolean(query.data?.isMock);
  const isDetailMock = Boolean(detail.data?.isMock);

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      {isListMock ? <DemoDataBanner context="KYC" /> : null}
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
        {userIdFilter ? (
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
            render: (group) => (
              <>
                {group.user.name ?? "—"} <span className="muted">{group.user.phone}</span>
              </>
            ),
          },
          {
            header: "Documents",
            wrap: true,
            render: (group) => (
              <div className="kyc-doc-badges">
                {DOC_TYPES.map((type) => {
                  const doc = group.documents.find((d) => d.document_type === type);
                  return (
                    <Badge
                      key={type}
                      label={doc ? `${DOC_LABEL[type]}: ${doc.status}` : `${DOC_LABEL[type]}: —`}
                      tone={doc ? STATUS_TONE[doc.status] : "neutral"}
                    />
                  );
                })}
              </div>
            ),
          },
          {
            header: "Latest activity",
            render: (group) =>
              new Date(Math.max(...group.documents.map((d) => new Date(d.created_at).getTime()))).toLocaleString(
                "en-IN"
              ),
          },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (group) => (
              <ActionMenu items={[{ label: "Review", tone: "brand", onSelect: () => openReview(group) }]} />
            ),
          },
        ]}
        rows={query.data?.data.items ?? []}
        rowKey={(group) => group.user.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load documents" : null}
        emptyTitle="No documents in this queue"
        emptyHint="Uploaded Aadhaar, driving licence, and selfie files appear here for admin verification."
        footer={<Pagination page={page} total={query.data?.data.total ?? 0} limit={20} onPageChange={setPage} />}
      />

      {selectedUserId && !activeGroup ? (
        <div className="drawer-backdrop" onClick={closeReview} role="presentation">
          <aside className="drawer-panel" onClick={(event) => event.stopPropagation()} aria-label="Document review">
            <button type="button" className="admin-signout" onClick={closeReview}>Close</button>
            {detail.isError ? (
              <div role="alert">
                <p>Document review could not be loaded.</p>
                <button type="button" className="table-action" onClick={() => void detail.refetch()}>Retry review</button>
              </div>
            ) : <p>Loading documents...</p>}
          </aside>
        </div>
      ) : null}
      {selectedUserId && activeGroup ? (
        <div className="drawer-backdrop" onClick={closeReview} role="presentation">
          <aside className="drawer-panel" onClick={(event) => event.stopPropagation()} aria-label="Document review">
            <div className="drawer-head">
              <div>
                <div className="drawer-kicker">{activeGroup.documents.length} document(s)</div>
                <h2>{activeGroup.user.name ?? "Unknown user"}</h2>
                <p>{activeGroup.user.phone}</p>
              </div>
              <button type="button" className="admin-signout" onClick={closeReview}>
                Close
              </button>
            </div>
            {isDetailMock ? <DemoDataBanner context="KYC document" /> : null}
            {activeGroup.documents.map((doc) => {
              const canDecide = doc.status === "pending" || doc.status === "failed";
              return (
                <div key={doc.id} className="kyc-doc-card">
                  <div className="kyc-doc-card-head">
                    <strong>{DOC_LABEL[doc.document_type]}</strong>
                    <Badge label={doc.status} tone={STATUS_TONE[doc.status]} />
                  </div>
                  <div className="kyc-preview">
                    {doc.previewUrl ? (
                      <img src={doc.previewUrl} alt={`${DOC_LABEL[doc.document_type]} upload`} />
                    ) : (
                      <div className="kyc-preview-empty">
                        Document file is stored. Open this review on a live environment to see the photo.
                      </div>
                    )}
                  </div>
                  <div className="drawer-meta">
                    <span>Uploaded {new Date(doc.created_at).toLocaleString("en-IN")}</span>
                    {doc.reviewed_at ? <span>Reviewed {new Date(doc.reviewed_at).toLocaleString("en-IN")}</span> : null}
                  </div>
                  {doc.review_note && !canDecide ? <p className="drawer-note">{doc.review_note}</p> : null}
                  {canDecide ? (
                    <>
                      <label className="drawer-label">
                        Review note
                        <textarea
                          value={notes[doc.id] ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                          placeholder="Optional — reason if you reject"
                          rows={2}
                        />
                      </label>
                      <div className="drawer-actions">
                        <button
                          type="button"
                          className="btn-reject"
                          disabled={savingId === doc.id}
                          onClick={() => void review(doc.id, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn-approve"
                          disabled={savingId === doc.id}
                          onClick={() => void review(doc.id, "approve")}
                        >
                          Verify document
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
