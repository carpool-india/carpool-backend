import { Link } from "react-router-dom";
import type { Booking, Trip } from "@rideshare/types";
import { Icon, icons } from "../components/Icon";
import { JourneyScene } from "../components/JourneyScene";
import { Card, Page, PageHeader, StatusPill } from "../components/ui";
import { DataFeedback } from "../components/DataFeedback";
import { useRemoteData } from "../hooks/useRemoteData";
import { useAuthStore } from "../store/authStore";
import { formatTripWhen } from "../utils/format";

export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const bookings = useRemoteData<{ bookings: Booking[] }>("/bookings/me");
  const trips = useRemoteData<{ trips: Trip[] }>("/trips");
  const now = Date.now();
  const upcoming = (bookings.data?.bookings ?? []).filter(item =>
    ["confirmed", "pending", "pending_approval"].includes(item.status) &&
    (!item.trip || new Date(item.trip.departureTime).getTime() >= now)
  ).sort((a, b) => (a.trip ? Date.parse(a.trip.departureTime) : Infinity) - (b.trip ? Date.parse(b.trip.departureTime) : Infinity));
  const offered = (trips.data?.trips ?? []).filter(item => item.status === "in_progress" || (item.status === "active" && Date.parse(item.departureTime) >= now));
  const verified = Boolean(user?.aadhaarVerified && user?.faceMatchDone);
  const nextRide = upcoming[0];
  const quickLinks = [
    { to: "/search", title: "Find a ride", body: "Your next destination", icon: icons.search },
    { to: "/post", title: "Offer a ride", body: "Put empty seats to use", icon: icons.plus },
    { to: "/inbox", title: "Your inbox", body: "Keep plans in one place", icon: icons.chat },
    { to: "/payments", title: "Payments", body: "Review booking costs", icon: icons.wallet },
  ];
  return (
    <Page width="full">
      <PageHeader kicker="YOUR TRAVEL SPACE" title={`Welcome back${user?.name ? ", " + user.name.split(" ")[0] : ""}.`} subtitle="Every journey, conversation, and detail. Right here." action={<Link to="/search" className="workspace-primary"><Icon path={icons.search} /> Find a ride</Link>} />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="dashboard-welcome">
            <div><span className="eyebrow">A LITTLE MORE TOGETHER</span><h2>Wherever life takes you,<br /><em>share the way there.</em></h2><p>Plan your next trip or make room for someone on yours.</p><Link to="/search" className="button-lime">Plan a journey <Icon path={icons.arrowRight} /></Link></div>
            <JourneyScene compact />
          </section>
          <div className="dashboard-quick">{quickLinks.map(item => <Link key={item.to} to={item.to}><span><Icon path={item.icon} /></span><strong>{item.title}</strong><small>{item.body}</small><Icon path={icons.arrowRight} className="quick-arrow h-4 w-4" /></Link>)}</div>
          <section className="dashboard-section">
            <div className="section-row"><h2>Your next journey</h2><Link to="/trips">View all trips <span aria-hidden="true">↗</span></Link></div>
            <DataFeedback loading={bookings.loading} error={bookings.error} onRetry={bookings.reload} />
            {!bookings.loading && !bookings.error && (nextRide ? <Card className="next-journey"><div className="section-row"><StatusPill status={nextRide.status} /><span className="text-xs text-ink-soft">{nextRide.seatsBooked} seat(s)</span></div><h3>{nextRide.trip ? `${nextRide.trip.originName} → ${nextRide.trip.destinationName}` : "Your booked ride"}</h3><p>{nextRide.trip ? formatTripWhen(nextRide.trip.departureTime) : "Open My trips for details"}</p><div className="workspace-actions"><Link className="workspace-primary" to={`/trips/${nextRide.tripId}/live?bookingId=${nextRide.id}`}>Open journey <Icon path={icons.arrowRight} /></Link><Link className="workspace-secondary" to={`/inbox/${nextRide.tripId}`}>Message your co-riders</Link></div></Card> : <Card className="dashboard-empty"><span className="empty-route-icon"><Icon path={icons.route} className="h-7 w-7" /></span><div><h3>Your next story is still unwritten.</h3><p>Find a ride going your way. Your upcoming bookings will appear here.</p><Link to="/search" className="text-link">Explore rides <Icon path={icons.arrowRight} /></Link></div></Card>)}
          </section>
          <section className="dashboard-section"><div className="section-row"><h2>Rides you're offering</h2><Link to="/trips?view=offered">Manage rides ↗</Link></div><DataFeedback loading={trips.loading} error={trips.error} onRetry={trips.reload} />{!trips.loading && !trips.error && <Card className="p-5">{offered.length ? offered.slice(0, 3).map(trip => <Link className="dashboard-trip-row" key={trip.id} to={`/trips/${trip.id}/manage`}><span className="mini-icon"><Icon path={icons.car} /></span><div><strong>{trip.originName} → {trip.destinationName}</strong><p>{formatTripWhen(trip.departureTime)} · {trip.seatsAvailable} seats available</p></div><Icon path={icons.arrowRight} /></Link>) : <div className="section-row"><div><h3>Have a journey planned?</h3><p className="mt-2 text-sm text-ink-soft">Share your seats and split the travel costs.</p></div><Link className="workspace-secondary" to="/post">Offer a ride</Link></div>}</Card>}</section>
        </div>
        <aside className="dashboard-aside">
          <Card className="profile-summary"><span className="eyebrow">YOUR RIDESHARE PROFILE</span><div className="trust-score"><Icon path={icons.shield} className="h-8 w-8" /><strong>{user?.trustScore ?? 0}<small>Trust score</small></strong></div><StatusPill status={verified ? "confirmed" : "pending"} /><p>{verified ? "Your identity checks are complete. Keep your profile and vehicle details up to date." : "Complete your identity checks to get ready for your first shared ride."}</p><Link className="workspace-secondary" to="/kyc">{verified ? "View verification" : "Complete verification"} <Icon path={icons.arrowRight} /></Link></Card>
          <Card className="p-5"><h2 className="panel-title">Your journeys at a glance</h2><dl className="account-stats"><div><dt>Upcoming bookings</dt><dd>{bookings.data ? upcoming.length : "—"}</dd></div><div><dt>Active rides offered</dt><dd>{trips.data ? offered.length : "—"}</dd></div><div><dt>Completed bookings</dt><dd>{bookings.data ? bookings.data.bookings.filter(item => item.status === "completed").length : "—"}</dd></div></dl></Card>
          <div className="safety-callout"><span className="mini-icon"><Icon path={icons.shield} /></span><h2>A little preparation.<br />More peace of mind.</h2><p>Add the people you trust as emergency contacts before your next trip.</p><Link to="/emergency-contacts">Manage emergency contacts <span aria-hidden="true">↗</span></Link></div>
        </aside>
      </div>
    </Page>
  );
}

