import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const TABS = [
  { to: "/search", label: "Search" },
  { to: "/trips", label: "My Trips" },
  { to: "/post", label: "Post a Ride" },
  { to: "/profile", label: "Profile" },
];

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const onLanding = location.pathname === "/";
  const user = useAuthStore((state) => state.user);
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const signOut = useAuthStore((state) => state.signOut);

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
          RideShare <span className="text-brand">India</span>
        </Link>
        {onLanding ? (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-soft sm:flex">
            <a href="#features" className="transition hover:text-ink">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#faq" className="transition hover:text-ink">
              FAQ
            </a>
          </nav>
        ) : null}
        {sessionToken ? (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-ink-soft sm:block">
              {user?.name ? `Hi, ${user.name.split(" ")[0]}` : ""}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark"
          >
            Log in
          </Link>
        )}
      </div>
      {sessionToken ? (
        <div className="border-t border-line/70">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold transition ${
                    isActive ? "border-brand text-brand" : "border-transparent text-ink-faint hover:text-ink"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line/70 py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-ink-faint">
        © {new Date().getFullYear()} RideShare India. All rights reserved.
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
