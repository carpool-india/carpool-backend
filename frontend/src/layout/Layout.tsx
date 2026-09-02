import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function Nav() {
  const location = useLocation();
  const onLanding = location.pathname === "/";
  const sessionToken = useAuthStore((state) => state.sessionToken);

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
          <Link
            to="/search"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark"
          >
            Go to app
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark"
          >
            Log in
          </Link>
        )}
      </div>
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
