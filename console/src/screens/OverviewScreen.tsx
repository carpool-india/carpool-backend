import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bookingGet, paymentGet, safetyGet } from "../lib/api";
import { StatTile } from "../components/StatTile";
import { DataTable } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { DemoDataBanner } from "../components/DemoDataBanner";
import { liveOrMock, MOCK_OPEN_SOS, MOCK_OVERVIEW, MOCK_REVENUE } from "../lib/mockData";

interface Overview {
  totalUsers: number;
  kycPending: number;
  activeTrips: number;
  bookingsToday: number;
}

interface RevenueSummary {
  platformFee: { allTime: number; thisMonth: number };
  cancellationBonds: { allTime: number; thisMonth: number };
  subscriptionRevenueActive: number;
}

interface SafetyEvent {
  id: string;
  event_type: string;
  severity: string;
  created_at: string;
  users: { name: string | null; phone: string } | null;
}

function inr(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function OverviewScreen() {
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => liveOrMock(() => bookingGet<Overview>("/admin/overview"), MOCK_OVERVIEW),
  });
  const revenue = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => liveOrMock(() => paymentGet<RevenueSummary>("/admin/revenue-summary"), MOCK_REVENUE),
  });
  const unresolvedSos = useQuery({
    queryKey: ["admin-sos-unresolved"],
    queryFn: () =>
      liveOrMock(
        () =>
          safetyGet<{ items: SafetyEvent[]; total: number }>("/admin/safety-events?eventType=sos&resolved=false&limit=5"),
        { items: MOCK_OPEN_SOS, total: MOCK_OPEN_SOS.length },
        (data) => data.items.length === 0
      ),
    refetchInterval: 15000,
  });

  const overviewData = overview.data?.data;
  const revenueData = revenue.data?.data;
  const sosData = unresolvedSos.data?.data;
  const showOverviewBanner = Boolean(overview.data?.isMock || revenue.data?.isMock);

  return (
    <div className="page-frame">
      {showOverviewBanner ? <DemoDataBanner context="overview" /> : null}
      {sosData && sosData.total > 0 ? (
        <Link to="/safety" className="sos-banner">
          <span className="sos-banner-copy">
            <span className="sos-dot" aria-hidden />
            {sosData.total} unresolved SOS alert{sosData.total > 1 ? "s" : ""}
          </span>
          <span className="sos-banner-link">Review</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total users" value={overviewData?.totalUsers ?? "…"} />
        <Link to="/kyc" className="stat-tile-link">
          <StatTile label="KYC pending" value={overviewData?.kycPending ?? "…"} />
        </Link>
        <Link to="/trips" className="stat-tile-link">
          <StatTile label="Active trips" value={overviewData?.activeTrips ?? "…"} />
        </Link>
        <Link to="/bookings" className="stat-tile-link">
          <StatTile label="Bookings today" value={overviewData?.bookingsToday ?? "…"} />
        </Link>
      </div>

      <h2 className="section-label">Revenue</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Platform fee (month)" value={revenueData ? inr(revenueData.platformFee.thisMonth) : "…"} />
        <StatTile label="Platform fee (all time)" value={revenueData ? inr(revenueData.platformFee.allTime) : "…"} />
        <StatTile
          label="Cancellation bonds (month)"
          value={revenueData ? inr(revenueData.cancellationBonds.thisMonth) : "…"}
        />
        <StatTile
          label="Active subscription revenue"
          value={revenueData ? inr(revenueData.subscriptionRevenueActive) : "…"}
        />
      </div>

      <h2 className="section-label">Open SOS</h2>
      {unresolvedSos.data?.isMock ? <DemoDataBanner context="SOS" /> : null}
      <DataTable
        columns={[
          { header: "Type", render: (event) => event.event_type.replace(/_/g, " ") },
          { header: "Severity", render: (event) => <Badge label={event.severity} tone={event.severity === "critical" ? "critical" : "warn"} /> },
          {
            header: "User",
            render: (event) => (
              <>
                {event.users?.name ?? "—"} <span className="muted">{event.users?.phone}</span>
              </>
            ),
          },
          { header: "When", render: (event) => new Date(event.created_at).toLocaleString("en-IN") },
        ]}
        rows={sosData?.items ?? []}
        rowKey={(event) => event.id}
        loading={unresolvedSos.isLoading}
        error={unresolvedSos.error instanceof Error ? unresolvedSos.error.message : unresolvedSos.error ? "Unable to load SOS" : null}
        emptyTitle="No open SOS alerts"
        emptyHint="This table is always on the dashboard. New SOS events will land here instantly."
      />
    </div>
  );
}
