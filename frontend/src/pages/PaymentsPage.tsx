import { useState } from "react";
import { Link } from "react-router-dom";
import type { Booking } from "@rideshare/types";
import { api, serviceUrls } from "../services/api";
import { useRemoteData } from "../hooks/useRemoteData";
import { DataFeedback } from "../components/DataFeedback";
import { Alert, Card, EmptyState, Page, PageHeader, StatusPill } from "../components/ui";
import { formatInr, formatTripWhen } from "../utils/format";

export function PaymentsPage() {
  const resource = useRemoteData<{ bookings: Booking[] }>("/bookings/me");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bookings = [...(resource.data?.bookings ?? [])].sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt));

  async function downloadInvoice(id: string) {
    setDownloading(id);
    setError(null);
    try {
      const { data } = await api.get<Blob>(`${serviceUrls.booking}/bookings/${id}/invoice`, { responseType: "blob" });
      if (!data.type.includes("pdf")) throw new Error("The invoice is not available. Please try again.");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rideshare-invoice-${id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to download the invoice.");
    } finally { setDownloading(null); }
  }

  return <Page width="full">
    <PageHeader kicker="CLEAR COSTS. NO GUESSWORK." title="Payments & invoices" subtitle="Review your booking costs and download invoices." action={<Link to="/plans" className="workspace-secondary">View membership plans</Link>} />
    <p className="workspace-note">Ride fares are paid directly to your driver by UPI or cash. Only platform fees are collected online. These records show booking costs, not a wallet balance or bank statement.</p>
    <DataFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
    {error && <Alert tone="red">{error}</Alert>}
    {resource.data && <><div className="payment-grid"><div><span>Total bookings</span><strong>{bookings.length}</strong></div><div><span>Completed journeys</span><strong>{bookings.filter(item => item.status === "completed").length}</strong></div><div><span>Cancelled bookings</span><strong>{bookings.filter(item => item.status === "cancelled").length}</strong></div></div>
      {bookings.length ? <div className="payment-list">{bookings.map(item => <article className="payment-record" key={item.id}><div className="section-row"><div><h2>{item.trip ? `${item.trip.originName} → ${item.trip.destinationName}` : "Ride booking"}</h2><p>{item.trip ? formatTripWhen(item.trip.departureTime) : new Date(item.createdAt).toLocaleDateString("en-IN")}</p></div><StatusPill status={item.status} /></div><dl className="payment-breakdown"><div><dt>Fare paid to driver</dt><dd>{formatInr(item.subtotal)}</dd></div><div><dt>Platform fee</dt><dd>{formatInr(item.serviceFee)}</dd></div><div><dt>Total booking cost</dt><dd>{formatInr(item.totalAmount)}</dd></div></dl><div className="workspace-actions"><button className="workspace-secondary" disabled={downloading !== null} onClick={() => void downloadInvoice(item.id)}>{downloading === item.id ? "Downloading…" : "Download invoice"}</button><span className="text-xs text-ink-faint">Reference {item.id.slice(0, 8)}</span></div></article>)}</div> : <Card><EmptyState title="Your booking costs will appear here" body="Once you book a ride, you can review its fare and platform fee in this space." action={<Link to="/search" className="workspace-primary">Find a ride</Link>} /></Card>}
    </>}
  </Page>;
}

