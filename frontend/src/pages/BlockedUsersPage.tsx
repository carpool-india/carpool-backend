import { useState } from "react";
import { api, serviceUrls } from "../services/api";
import { useRemoteData } from "../hooks/useRemoteData";
import { DataFeedback } from "../components/DataFeedback";
import { Alert, Avatar, Card, EmptyState, Page, PageHeader } from "../components/ui";

interface BlockedUser { id: string; name: string | null; photoUrl: string | null; }
export function BlockedUsersPage() {
  const resource = useRemoteData<{ users: BlockedUser[] }>("/trust/blocks");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function unblock(id: string) {
    setBusy(id); setError(null);
    try { await api.delete(`${serviceUrls.booking}/trust/blocks`, { data: { blockedId: id } }); resource.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to unblock this user."); }
    finally { setBusy(null); }
  }
  return <Page><PageHeader kicker="YOUR BOUNDARIES" title="Blocked users" subtitle="Manage who you've blocked. Unblocking lets them interact with you again." /><DataFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />{error && <Alert tone="red">{error}</Alert>}{resource.data && (resource.data.users.length ? <div className="workspace-list">{resource.data.users.map(user => <div className="workspace-list-item" key={user.id}><Avatar name={user.name} photoUrl={user.photoUrl} /><div className="item-copy"><h2>{user.name ?? "RideShare user"}</h2><p>Blocked from interacting with you</p></div><button className="workspace-secondary" disabled={busy !== null} onClick={() => void unblock(user.id)}>{busy === user.id ? "Unblocking…" : "Unblock"}</button></div>)}</div> : <Card><EmptyState title="No blocked users" body="People you block from a trip will appear here." /></Card>)}</Page>;
}

