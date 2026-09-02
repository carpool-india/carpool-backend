import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { NavIcon, type IconName } from "../components/NavIcon";

const NAV_ITEMS: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: "/", label: "Overview", icon: "overview", end: true },
  { to: "/safety", label: "Safety", icon: "safety" },
  { to: "/reports", label: "Reports", icon: "reports" },
  { to: "/users", label: "Users", icon: "users" },
  { to: "/kyc", label: "Documents", icon: "kyc" },
  { to: "/vehicles", label: "Vehicles", icon: "vehicles" },
  { to: "/trips", label: "Trips", icon: "trips" },
  { to: "/bookings", label: "Bookings", icon: "bookings" },
  { to: "/subscriptions", label: "Plans", icon: "plans" },
  { to: "/payments", label: "Payments", icon: "payments" },
  { to: "/ratings", label: "Ratings", icon: "ratings" },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Overview", subtitle: "Live platform snapshot" },
  "/safety": { title: "Safety", subtitle: "SOS, deviations, OTP failures, fraud flags" },
  "/reports": { title: "Reports", subtitle: "User-submitted reports about other users" },
  "/users": { title: "Users", subtitle: "Search, verify, and manage access" },
  "/kyc": { title: "Documents", subtitle: "Review uploaded KYC files and verify identity" },
  "/vehicles": { title: "Vehicles", subtitle: "Verify cars and bikes before they take passengers" },
  "/trips": { title: "Trips", subtitle: "Rides posted on the platform" },
  "/bookings": { title: "Bookings", subtitle: "Seats booked on the platform" },
  "/subscriptions": { title: "Plans", subtitle: "Driver plans and passenger subscriptions" },
  "/payments": { title: "Payments", subtitle: "Fees, bonds, and refunds" },
  "/ratings": { title: "Ratings", subtitle: "Trip ratings for moderation" },
};

export function AppShell() {
  const { session, signOut } = useAuth();
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] ?? { title: "Admin", subtitle: "Operations" };
  const initial = (session?.user.email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="brand-mark">R</div>
          <div className="admin-brand-copy">
            <div className="admin-brand-name">RideShare</div>
            <div className="admin-brand-role">Admin</div>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? "admin-nav-link-active" : ""}`}
            >
              <NavIcon name={item.icon} />
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-stage">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <h1>{meta.title}</h1>
            <span className="admin-topbar-meta">{meta.subtitle}</span>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip" title={session?.user.email ?? ""}>
              <span className="admin-user-avatar">{initial}</span>
              <span className="admin-user-email">{session?.user.email}</span>
            </div>
            <button type="button" onClick={() => void signOut()} className="admin-signout">
              Sign out
            </button>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
