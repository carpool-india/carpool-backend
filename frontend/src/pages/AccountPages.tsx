import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Alert, Card, Page, PageHeader } from "../components/ui";
import { useAuthStore, type AppLanguage } from "../store/authStore";
import { useTripStore } from "../store/tripStore";
import { bookingPost } from "../services/api";

const safetyLinks = [
  { to: "/kyc", title: "Identity verification", body: "Review Aadhaar, driving licence, and face verification.", icon: icons.shield },
  { to: "/emergency-contacts", title: "Emergency contacts", body: "Keep the people you trust close to every journey.", icon: icons.users },
  { to: "/blocked-users", title: "Blocked users", body: "Review and manage your blocked contacts.", icon: icons.block },
  { to: "/help", title: "Safety & trip guidance", body: "Know how live tracking, SOS, and trip support work.", icon: icons.chat },
];

export function SafetyPage() {
  return <Page width="full"><PageHeader kicker="TRAVEL WITH CONFIDENCE" title="Safety centre" subtitle="The checks, contacts, and controls that help you prepare for every trip." /><div className="workspace-menu-grid">{safetyLinks.map(item => <Link to={item.to} className="workspace-menu-card" key={item.to}><span className="mini-icon"><Icon path={item.icon} /></span><div><h2>{item.title}</h2><p>{item.body}</p></div><Icon path={icons.arrowRight} className="h-4 w-4" /></Link>)}</div><Card className="workspace-panel mt-6"><h2>During your journey</h2><p className="workspace-note">Open a confirmed trip from My trips to access the live map, trip chat, and SOS. Check that the driver and vehicle match your booking before you travel.</p><div className="workspace-actions"><Link className="workspace-primary" to="/trips">Open My trips</Link><Link className="workspace-secondary" to="/emergency-contacts">Add emergency contacts</Link></div></Card></Page>;
}

export function SettingsPage() {
  const language = useAuthStore(state => state.language);
  const setLanguage = useAuthStore(state => state.setLanguage);
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function deleteAccount() {
    if (confirmation !== "DELETE") return;
    setDeleting(true); setError(null);
    try {
      await bookingPost("/account/delete", {});
      useAuthStore.getState().signOut();
      useTripStore.setState({ activeBooking: null, selectedMatch: null, matches: [], searchNote: null });
      navigate("/", { replace: true });
      const { supabase } = await import("../lib/supabase");
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete your account."); }
    finally { setDeleting(false); }
  }
  return <Page width="full"><PageHeader kicker="MAKE IT YOURS" title="Account settings" subtitle="Your profile, preferences, and account controls." /><div className="workspace-two-col"><div className="workspace-list">
    {[{to:"/profile", title:"Personal profile", body:"Update your name, photo, and profile details.", icon:icons.person}, {to:"/vehicle",title:"Your vehicles",body:"Manage your car and bike details.",icon:icons.car}, {to:"/plans",title:"Membership plans",body:"Review passenger and driver subscriptions.",icon:icons.score}, {to:"/payments",title:"Payments & invoices",body:"See the fare and platform fee for each booking.",icon:icons.wallet}].map(item => <Link className="workspace-menu-card" to={item.to} key={item.to}><span className="mini-icon"><Icon path={item.icon} /></span><div><h2>{item.title}</h2><p>{item.body}</p></div><Icon path={icons.arrowRight} /></Link>)}
    </div><Card className="workspace-panel"><h2>Language preference</h2><p className="workspace-note">Choose the language used for supported app labels. Your preference is saved on this device.</p><fieldset className="workspace-list"><legend className="sr-only">Application language</legend>{([{code:"en",label:"English"}, {code:"hi",label:"हिन्दी"}, {code:"ta",label:"தமிழ்"}] as {code:AppLanguage;label:string}[]).map(item => <label key={item.code} className="workspace-list-item cursor-pointer"><input type="radio" name="language" value={item.code} checked={language===item.code} onChange={() => setLanguage(item.code)} /><span className="font-semibold text-sm">{item.label}</span></label>)}</fieldset><p role="status" className="workspace-note">Preference saved automatically.</p></Card></div>
    <Card className="workspace-panel mt-7"><h2>Account controls</h2><p className="workspace-note">Need help first? <Link className="font-semibold text-brand underline" to="/help">Visit the help centre.</Link></p><details><summary className="text-red-700">Delete my account</summary><p>This permanently removes your personal profile and cancels active bookings and offered rides. Normal cancellation rules still apply. Shared journey and transaction records may remain. This cannot be undone.</p><label className="block max-w-sm text-sm font-semibold">Type DELETE to confirm<input className="workspace-input" value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="off" /></label>{error && <Alert tone="red">{error}</Alert>}<button className="workspace-primary !bg-red-700 !border-red-700 mt-4" disabled={deleting || confirmation !== "DELETE"} onClick={()=>void deleteAccount()}>{deleting ? "Deleting account…" : "Permanently delete account"}</button></details></Card>
  </Page>;
}

const questions = [
  ["How do I find and book a ride?", "Open Find a ride, enter your pickup and destination, choose a date and seats, then compare available rides. Review the driver, vehicle, and fare before booking. Request-based bookings need driver approval."],
  ["Where are my conversations and updates?", "Open Inbox for trip conversations and the Booking alerts tab for current booking updates. You can also start a conversation directly from My trips."],
  ["How do payments work?", "The ride fare is paid directly to your driver using UPI or cash. The separate platform fee is collected online unless your active passenger plan waives it. Review costs and invoices under Payments."],
  ["How do I offer a ride?", "Complete identity verification, register your vehicle, and activate the appropriate driver plan. Then open Offer a ride, choose the route, departure time, seats, and fare. Manage passenger requests from the Offered tab in My trips."],
  ["Where can I see live tracking?", "Open a confirmed booking in My trips and select Track live. The map shows the driver's location when they are sharing it. Drivers can share their location from the mobile app; browser access to a passenger's live map does not start driver tracking."],
  ["How does SOS work?", "During a trip, hold the SOS button for two seconds. The browser will request location access before sending the alert. If location or the network is unavailable, the app shows the failure and a direct emergency-call option. In an immediate emergency in India, call 112."],
  ["How do I report a problem with a co-rider?", "Open the trip or passenger details, expand Safety options, and submit a report. You can also block the person. Manage blocked users from the Safety centre."],
  ["What if I cannot sign in?", "Check the mobile number, enter the newest six-digit code, and use Resend after the cooldown. If the service cannot be reached, an error will appear so you can try again."],
];

export function HelpPage() {
  return <Page width="full"><PageHeader kicker="HERE FOR THE JOURNEY" title="Help centre" subtitle="Find your way around RideShare and get ready for the road." /><div className="workspace-two-col"><Card className="workspace-panel"><h2>Common questions</h2>{questions.map(([title,body])=><details key={title} className="border-b border-line last:border-0"><summary>{title}</summary><p>{body}</p></details>)}</Card><div className="workspace-list"><Card className="workspace-panel"><h2>Your safety tools</h2><p className="workspace-note">Manage verification, trusted contacts, and blocked users in one place.</p><Link to="/safety" className="workspace-primary">Open safety centre</Link></Card><Card className="workspace-panel"><h2>Immediate emergency?</h2><p className="workspace-note">For an emergency in India, call 112. This is the emergency-services number, not RideShare customer support.</p><a href="tel:112" className="workspace-secondary !text-red-700">Call emergency services · 112</a></Card></div></div></Page>;
}

