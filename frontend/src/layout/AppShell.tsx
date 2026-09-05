import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Logo } from "../components/Logo";
import { Avatar } from "../components/ui";
import { useAuthStore } from "../store/authStore";

const NAV_ITEMS = [
  { to: "/search", label: "Search", icon: icons.search },
  { to: "/trips", label: "My trips", icon: icons.calendar },
  { to: "/post", label: "Post a ride", icon: icons.plus },
  { to: "/vehicle", label: "Vehicle", icon: icons.car },
  { to: "/plans", label: "Plans", icon: icons.wallet },
  { to: "/profile", label: "Profile", icon: icons.person },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    onNavigate?.();
    navigate("/");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-6 pt-5">
        <Logo to="/search" variant="dark" />
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-white/10 text-white shadow-glow" : "text-white/55 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon path={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <NavLink to="/profile" onClick={onNavigate} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/5">
          <Avatar name={user?.name} photoUrl={user?.photoUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user?.name ?? "Your profile"}</p>
            <p className="truncate text-[11px] text-white/40">{user?.phone}</p>
          </div>
        </NavLink>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
        >
          <Icon path={icons.logout} className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      <aside className="hidden w-[272px] shrink-0 bg-ink lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-ink/50" />
          <aside className="relative flex h-full w-[272px] flex-col bg-ink shadow-floating">
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setDrawerOpen(true)} className="text-ink-soft lg:hidden" aria-label="Open menu">
                <Icon path={icons.menu} className="h-5 w-5" />
              </button>
              <div className="lg:hidden">
                <Logo to="/search" />
              </div>
            </div>
            <NavLink to="/profile" className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 shadow-card">
              <Avatar name={user?.name} photoUrl={user?.photoUrl} size="sm" />
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-ink-soft sm:inline">{user?.name ?? user?.phone}</span>
            </NavLink>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
