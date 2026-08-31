import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, safetyGet, safetyPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { liveOrMock, MOCK_CONTACTS, MOCK_SAFETY, paginate } from "../lib/mockData";

interface SafetyEvent {
  id: string;
  event_type: string;
  severity: string;
  lat: number | null;
  lng: number | null;
  metadata: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
  user_id?: string;
  trip_id?: string | null;
  booking_id?: string | null;
  users: { name: string | null; phone: string } | null;
}

const SEVERITY_TONE: Record<string, "critical" | "warn" | "neutral"> = {
  critical: "critical",
  high: "warn",
  medium: "warn",
  low: "neutral",
};

export function SafetyScreen() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("");
  const [severity, setSeverity] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState<"" | "true" | "false">("false");
  const [selected, setSelected] = useState<SafetyEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-safety-events", page, eventType, severity, resolvedFilter],
    queryFn: () => {
      const filtered = MOCK_SAFETY.filter((event) => {
        const typeOk = !eventType || event.event_type === eventType;
        const severityOk = !severity || event.severity === severity;
        const resolvedOk =
          resolvedFilter === "" ? true : resolvedFilter === "true" ? event.resolved : !event.resolved;
        return typeOk && severityOk && resolvedOk;
      });
      return liveOrMock(
        () =>
          safetyGet<{ items: SafetyEvent[]; total: number }>(
            `/admin/safety-events?page=${page}&limit=20${eventType ? `&eventType=${eventType}` : ""}${
              severity ? `&severity=${severity}` : ""
            }${resolvedFilter ? `&resolved=${resolvedFilter}` : ""}`
          ),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
    refetchInterval: 15000,
  });

  async function resolve(id: string) {
    setNotice(null);
    try {
      await safetyPatch(`/admin/safety-events/${id}/resolve`, {});
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to resolve event");
    }
    queryClient.setQueryData<{ items: SafetyEvent[]; total: number }>(
      ["admin-safety-events", page, eventType, severity, resolvedFilter],
      (old) =>
        old
          ? {
              ...old,
              items: old.items.map((item) => (item.id === id ? { ...item, resolved: true } : item)),
            }
          : old
    );
    void queryClient.invalidateQueries({ queryKey: ["admin-sos-unresolved"] });
    setSelected(null);
  }

  const contacts = useQuery({
    queryKey: ["admin-contacts", selected?.user_id],
    enabled: Boolean(selected?.user_id),
    queryFn: () => {
      const userId = selected?.user_id ?? "";
      return liveOrMock(
        () => bookingGet<{ items: Array<{ id: string; name: string; phone: string; relationship: string }> }>(`/admin/users/${userId}/contacts`),
        { items: MOCK_CONTACTS[userId] ?? [] }
      );
    },
  });

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <select
          value={eventType}
          onChange={(e) => {
            setPage(1);
            setEventType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="sos">SOS</option>
          <option value="route_deviation">Route deviation</option>
          <option value="otp_fail">OTP failure</option>
          <option value="fraud_flag">Fraud flag</option>
        </select>
        <select
          value={severity}
          onChange={(e) => {
            setPage(1);
            setSeverity(e.target.value);
          }}
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={resolvedFilter}
          onChange={(e) => {
            setPage(1);
            setResolvedFilter(e.target.value as typeof resolvedFilter);
          }}
        >
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          { header: "Type", render: (event) => event.event_type.replace(/_/g, " ") },
          { header: "Severity", render: (event) => <Badge label={event.severity} tone={SEVERITY_TONE[event.severity] ?? "neutral"} /> },
          {
            header: "User",
            render: (event) => (
              <>
                {event.users?.name ?? "—"} <span className="muted">{event.users?.phone}</span>
              </>
            ),
          },
          {
            header: "Location",
            render: (event) =>
              event.lat && event.lng ? (
                <a className="text-brand underline" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${event.lat},${event.lng}`}>
                  Open map
                </a>
              ) : (
                "—"
              ),
          },
          { header: "When", render: (event) => new Date(event.created_at).toLocaleString("en-IN") },
          {
            header: "Status",
            render: (event) => <Badge label={event.resolved ? "resolved" : "open"} tone={event.resolved ? "good" : "critical"} />,
          },
          {
            header: "Actions",
            align: "right",
            width: "160px",
            wrap: true,
            render: (event) => (
              <div className="table-actions">
                <button type="button" className="table-action" onClick={() => setSelected(event)}>
                  Details
                </button>
                {event.resolved ? null : (
                  <button type="button" onClick={() => void resolve(event.id)} className="table-action table-action-brand">
                    Resolve
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(event) => event.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load safety events" : null}
        emptyTitle="No safety events"
        emptyHint="SOS, OTP failures, and deviations will show in this table as soon as they are raised."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />

      {selected ? (
        <div className="drawer-backdrop" onClick={() => setSelected(null)} role="presentation">
          <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="drawer-kicker">{selected.event_type.replace(/_/g, " ")}</div>
                <h2>{selected.users?.name ?? "Unknown user"}</h2>
                <p>{selected.users?.phone}</p>
              </div>
              <button type="button" className="admin-signout" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="drawer-meta">
              <Badge label={selected.severity} tone={SEVERITY_TONE[selected.severity] ?? "neutral"} />
              <Badge label={selected.resolved ? "resolved" : "open"} tone={selected.resolved ? "good" : "critical"} />
              <span>{new Date(selected.created_at).toLocaleString("en-IN")}</span>
            </div>
            {selected.lat && selected.lng ? (
              <div className="event-map">
                <iframe
                  title="Event location"
                  src={
                    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)}&q=${selected.lat},${selected.lng}&zoom=15`
                      : `https://maps.google.com/maps?q=${selected.lat},${selected.lng}&z=15&output=embed`
                  }
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  className="text-brand underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://maps.google.com/?q=${selected.lat},${selected.lng}`}
                >
                  Open in Google Maps
                </a>
              </div>
            ) : null}
            <h3 className="section-label">Emergency contacts</h3>
            {contacts.data?.items.length ? (
              <ul className="contact-list">
                {contacts.data.items.map((contact) => (
                  <li key={contact.id}>
                    <strong>{contact.name}</strong> · {contact.relationship}
                    <div className="muted">{contact.phone}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No emergency contacts on file.</p>
            )}
            {selected.resolved ? null : (
              <div className="drawer-actions">
                <button type="button" className="btn-approve" onClick={() => void resolve(selected.id)}>
                  Mark resolved
                </button>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
