import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Booking } from "@rideshare/types";
import { ChatPanel } from "../components/ChatPanel";
import { DataFeedback } from "../components/DataFeedback";
import { Card, EmptyState, Page, PageHeader, StatusPill } from "../components/ui";
import { useRemoteData } from "../hooks/useRemoteData";

interface ChatPreview {
  tripId: string;
  originName: string;
  destinationName: string;
  lastMessageBody: string;
  lastMessageSenderName: string | null;
  lastMessageAt: string;
}

export function InboxPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [params] = useSearchParams();
  const alerts = !tripId && params.get("tab") === "alerts";
  const chats = useRemoteData<{ previews: ChatPreview[] }>("/chat/mine");
  const bookings = useRemoteData<{ bookings: Booking[] }>("/bookings/me");
  const previews = [...(chats.data?.previews ?? [])].sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
  const selected = previews.find(item => item.tripId === tripId);
  return <Page width="full">
    <PageHeader kicker="STAY CONNECTED" title="Your inbox" subtitle="Pickup plans, trip conversations, and booking updates in one place." action={<button className="workspace-secondary" onClick={() => { chats.reload(); bookings.reload(); }}>Refresh inbox</button>} />
    <nav className="workspace-tabs" aria-label="Inbox sections"><Link className={!alerts ? "active" : ""} to="/inbox">Conversations</Link><Link className={alerts ? "active" : ""} to="/inbox?tab=alerts">Booking alerts</Link></nav>
    {alerts ? <>
      <DataFeedback loading={bookings.loading} error={bookings.error} onRetry={bookings.reload} />
      {!bookings.loading && !bookings.error && (bookings.data?.bookings.length ? <div className="workspace-list">{[...bookings.data.bookings].sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)).map(item => <Link className="workspace-list-item" key={item.id} to="/trips"><div className="item-copy"><h2>{item.trip ? `${item.trip.originName} → ${item.trip.destinationName}` : "Your booking"}</h2><p>{item.seatsBooked} seat(s) · Booking {item.id.slice(0, 8)} · {new Date(item.createdAt).toLocaleDateString("en-IN")}</p><p>Current booking status. Open My trips for available actions.</p></div><StatusPill status={item.status} /></Link>)}</div> : <Card><EmptyState title="You're all caught up" body="Booking updates will appear here when you reserve a seat." /></Card>)}
    </> : <div className="inbox-layout">
      <aside><DataFeedback loading={chats.loading} error={chats.error} onRetry={chats.reload} />{previews.map(item => <Link key={item.tripId} className={`inbox-thread ${tripId === item.tripId ? "active" : ""}`} to={`/inbox/${item.tripId}`}><strong>{item.originName} → {item.destinationName}</strong><p>{item.lastMessageSenderName ? item.lastMessageSenderName + ": " : ""}{item.lastMessageBody}</p><small>{new Date(item.lastMessageAt).toLocaleString("en-IN")}</small></Link>)}{!chats.loading && !chats.error && !previews.length && <Card className="p-5"><h2 className="panel-title">No conversations yet</h2><p className="workspace-note">Open a chat from My trips to coordinate with your driver or passengers.</p><Link className="workspace-secondary" to="/trips">Go to My trips</Link></Card>}</aside>
      <section className="inbox-conversation" aria-label="Selected conversation">{tripId ? <><div className="section-row mb-4"><h2>{selected ? `${selected.originName} → ${selected.destinationName}` : "Trip conversation"}</h2><Link to={`/trips/${tripId}/live`}>Open journey ↗</Link></div><ChatPanel key={tripId} tripId={tripId} /></> : <Card><EmptyState title="Good journeys start with a hello." body="Select a conversation to coordinate pickup and keep your plans together." /></Card>}</section>
    </div>}
  </Page>;
}

