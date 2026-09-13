import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Logo } from "../components/Logo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Avatar } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { useTripStore } from "../store/tripStore";
import { t } from "../i18n/translations";

const groups = [
  { label: "YOUR JOURNEYS", items: [
    { to: "/dashboard", label: "Overview", icon: icons.radar },
    { to: "/search", label: "Find a ride", icon: icons.search },
    { to: "/trips", label: "My trips", icon: icons.calendar },
    { to: "/post", label: "Offer a ride", icon: icons.plus },
    { to: "/inbox", label: "Inbox", icon: icons.chat },
  ] },
  { label: "YOUR ACCOUNT", items: [
    { to: "/vehicle", label: "Vehicles", icon: icons.car },
    { to: "/plans", label: "Membership plans", icon: icons.score },
    { to: "/payments", label: "Payments", icon: icons.wallet },
    { to: "/safety", label: "Safety centre", icon: icons.shield },
    { to: "/settings", label: "Settings", icon: icons.person },
  ] },
];
const pageNames: Record<string, string> = {
  "/dashboard": "Overview", "/profile": "Your profile", "/kyc": "Identity verification",
  "/emergency-contacts": "Emergency contacts", "/blocked-users": "Blocked users",
  "/help": "Help centre", "/profile-setup": "Complete your profile",
  ...Object.fromEntries(groups.flatMap(group => group.items.map(item => [item.to, item.label]))),
};

export function AppShell() {
  const { pathname } = useLocation();
  const user = useAuthStore(state => state.user);
  const language = useAuthStore(state => state.language);
  const navigate = useNavigate();
  const drawer = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const title = pageNames[pathname] ?? (pathname.includes("/inbox/") ? "Trip conversation" : pathname.endsWith("/manage") ? "Manage your ride" : pathname.endsWith("/live") ? "Live journey" : pathname.endsWith("/rate") ? "Rate your journey" : "Journey details");

  useEffect(() => {
    drawer.current?.close();
    content.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  async function signOut() {
    // Clear local product state even when the authentication service is offline.
    useAuthStore.getState().signOut();
    useTripStore.setState({ activeBooking: null, selectedMatch: null, matches: [], searchNote: null });
    navigate("/", { replace: true });
    const { supabase } = await import("../lib/supabase");
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  }

  function sidebar(mobile = false) {
    return <div className="workspace-sidebar-content">
      <div className="workspace-brand"><Logo to="/dashboard" variant="dark" />{mobile && <button type="button" aria-label="Close menu" onClick={() => drawer.current?.close()}><Icon path={icons.close} /></button>}</div>
      <div className="workspace-nav-scroll">{groups.map(group => <nav key={group.label} aria-label={group.label}><p>{group.label}</p>{group.items.map(item => <NavLink key={item.to} to={item.to} onClick={() => drawer.current?.close()} className={({ isActive }) => isActive || (item.to === "/safety" && ["/kyc", "/emergency-contacts", "/blocked-users"].includes(pathname)) || (item.to === "/settings" && pathname === "/profile") ? "is-active" : ""}><Icon path={item.icon} /><span>{item.label}</span>{item.to === "/post" && <small>+</small>}</NavLink>)}</nav>)}</div>
      <div className="workspace-sidebar-footer"><Link to="/help"><Icon path={icons.chat} /><span>Help & support</span><span aria-hidden="true">↗</span></Link><div className="workspace-account"><Link to="/profile" aria-label="Open your profile"><Avatar name={user?.name} photoUrl={user?.photoUrl} size="sm" /><span><strong>{user?.name ?? "Your profile"}</strong><small>{user?.role === "passenger" ? "Passenger account" : "Rider & driver"}</small></span></Link><button type="button" onClick={() => void signOut()} aria-label={t(language, "signOut")} title={t(language, "signOut")}><Icon path={icons.logout} /></button></div></div>
    </div>;
  }

  return <div className="workspace">
    <a className="skip-link" href="#workspace-content">Skip to content</a>
    <aside className="workspace-sidebar">{sidebar()}</aside>
    <dialog ref={drawer} className="workspace-drawer" aria-label="Application navigation" onClose={() => menuButton.current?.focus()} onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}>{sidebar(true)}</dialog>
    <div className="workspace-body">
      <header className="workspace-topbar">
        <div className="workspace-breadcrumb"><button ref={menuButton} type="button" className="workspace-menu-button" aria-label="Open navigation" onClick={() => drawer.current?.showModal()}><Icon path={icons.menu} /></button><Link to="/dashboard">My workspace</Link><span aria-hidden="true">/</span><strong>{title}</strong></div>
        <div className="workspace-topbar-actions"><LanguageSwitcher /><Link to="/inbox?tab=alerts" className="workspace-icon-button" aria-label="Booking alerts"><Icon path={icons.radar} /></Link><Link to="/profile" className="workspace-profile-link" aria-label="Open your profile"><Avatar name={user?.name} photoUrl={user?.photoUrl} size="sm" /><span>{user?.name?.split(" ")[0] ?? "Profile"}</span><Icon path={icons.chevronDown} className="h-3 w-3" /></Link></div>
      </header>
      <main ref={content} id="workspace-content" tabIndex={-1} className="workspace-main"><Outlet /><footer className="workspace-foot"><span>RideShare India · Your journeys, connected.</span><Link to="/help">Need a hand? Visit the help centre ↗</Link></footer></main>
      <nav className="workspace-bottom-nav" aria-label="Quick navigation">{[groups[0].items[0], groups[0].items[1], groups[0].items[3], groups[0].items[2], groups[0].items[4]].map(item => <NavLink key={item.to} to={item.to}><Icon path={item.icon} /><span>{item.label === "Overview" ? "Home" : item.label}</span></NavLink>)}</nav>
    </div>
  </div>;
}
