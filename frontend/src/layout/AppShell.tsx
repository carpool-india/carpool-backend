import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { useAuthStore } from "../store/authStore";

const NAV_ITEMS = [
  { to: "/search", label: "Search", icon: icons.search },
  { to: "/trips", label: "My Trips", icon: icons.calendar },
  { to: "/post", label: "Post a Ride", icon: icons.plus },
  { to: "/vehicle", label: "Vehicle", icon: icons.car },
  { to: "/plans", label: "Plans", icon: icons.wallet },
  { to: "/profile", label: "Profile", icon: icons.person },
];

const SOON_ITEMS = ["KYC Documents", "Payments", "Emergency Contacts", "Help"];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/search": { title: "Search", subtitle: "Find a ride going your way" },
  "/trips": { title: "My Trips", subtitle: "Rides you've booked or posted" },
  "/post": { title: "Post a Ride", subtitle: "Publish a trip and set your price" },
  "/vehicle": { title: "Vehicle", subtitle: "Manage your car or bike" },
  "/plans": { title: "Plans", subtitle: "Driver and passenger subscriptions" },
  "/profile": { title: "Profile", subtitle: "Your details and verification status" },
};

function initials(name: string | null | undefined): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

function pageMeta(pathname: string) {
  if (PAGE_META[pathname]) {
    return PAGE_META[pathname];
  }
  if (pathname.startsWith("/rides/") && pathname.endsWith("/book")) {
    return { title: "Confirm booking", subtitle: "Review the fare and pay" };
  }
  if (pathname.startsWith("/rides/")) {
    return { title: "Ride details", subtitle: "Driver, vehicle, and trip info" };
  }
  if (pathname.startsWith("/bookings/")) {
    return { title: "Booking", subtitle: "Payment status" };
  }
  return { title: "RideShare India", subtitle: "" };
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link to="/search" onClick={onNavigate} className="flex items-center gap-2 px-5 pb-6 pt-5">
        <span className="font-display text-lg font-extrabold tracking-tight text-white">
          RideShare <span className="text-brand-light">India</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`
            }
          >
            <Icon path={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 px-3">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wide text-white/30">Coming soon</p>
        <div className="mt-1 flex flex-col gap-1">
          {SOON_ITEMS.map((label) => (
            <span key={label} className="cursor-not-allowed rounded-xl px-3 py-2 text-sm font-semibold text-white/25">
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const meta = pageMeta(location.pathname);

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink lg:flex">
        <SidebarContent />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <aside className="relative flex h-full w-64 flex-col bg-ink">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-5 text-white/60 hover:text-white"
              aria-label="Close menu"
            >
              <Icon path={icons.close} className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="text-ink-soft lg:hidden"
                aria-label="Open menu"
              >
                <Icon path={icons.menu} className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-lg font-extrabold tracking-tight text-ink sm:text-xl">{meta.title}</h1>
                {meta.subtitle ? <p className="text-xs text-ink-faint sm:text-sm">{meta.subtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name ?? "You"} className="h-full w-full object-cover" />
                  ) : (
                    initials(user?.name)
                  )}
                </div>
                <span className="text-sm font-semibold text-ink-soft">{user?.name ?? user?.phone}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
