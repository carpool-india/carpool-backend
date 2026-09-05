import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Logo } from "../components/Logo";
import { useAuthStore } from "../store/authStore";

const LANDING_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#drive", label: "Drive" },
  { href: "#faq", label: "FAQ" },
];

function Nav() {
  const location = useLocation();
  const onLanding = location.pathname === "/";
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!onLanding) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onLanding]);

  const overHero = onLanding && !scrolled;
  const dark = overHero;

  return (
    <header
      className={`z-30 transition-all duration-300 ${
        onLanding
          ? scrolled
            ? "fixed inset-x-0 top-0 border-b border-white/10 bg-ink/90 backdrop-blur-xl"
            : "absolute inset-x-0 top-0 border-b border-transparent bg-gradient-to-b from-ink/50 to-transparent"
          : "sticky top-0 border-b border-line/70 bg-paper/85 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <Logo variant={onLanding || dark ? "dark" : "light"} />
        {onLanding ? (
          <nav className={`hidden items-center gap-8 text-sm font-semibold lg:flex ${dark ? "text-white/80" : "text-white/80"}`}>
            {LANDING_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-soft sm:flex">
            <Link to="/search" className="transition hover:text-ink">
              Search rides
            </Link>
          </nav>
        )}
        <div className="flex items-center gap-2">
          {sessionToken ? (
            <Link
              to="/search"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark"
            >
              Go to app
            </Link>
          ) : (
            <Link
              to="/login"
              className={`rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition ${
                onLanding
                  ? "bg-white text-ink hover:bg-brand-light"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              Log in
            </Link>
          )}
          {onLanding ? (
            <button
              type="button"
              className={`ml-1 rounded-full p-2 lg:hidden ${dark ? "text-white" : "text-white"}`}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <Icon path={open ? icons.close : icons.menu} className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
      {onLanding && open ? (
        <div className="border-t border-white/10 bg-ink/95 px-5 py-4 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1">
            {LANDING_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-white px-3 py-2.5 text-center text-sm font-bold text-ink"
            >
              Log in
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line/70 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo variant="dark" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Verified intercity and local rides across India — with KYC, escrow payments, and a safety desk on every trip.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Product</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-white/70">
            <li>
              <a href="/#features" className="hover:text-white">
                Features
              </a>
            </li>
            <li>
              <a href="/#how-it-works" className="hover:text-white">
                How it works
              </a>
            </li>
            <li>
              <Link to="/search" className="hover:text-white">
                Search rides
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">For drivers</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-white/70">
            <li>
              <a href="/#drive" className="hover:text-white">
                Become a partner
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                Log in to post a ride
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Support</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-white/70">
            <li>
              <a href="/#faq" className="hover:text-white">
                FAQ
              </a>
            </li>
            <li>
              <a href="mailto:hello@rideshareindia.example" className="hover:text-white">
                hello@rideshareindia.example
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs font-semibold text-white/40 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} RideShare India. All rights reserved.</p>
          <p>KYC · UPI escrow · 24×7 SOS</p>
        </div>
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
