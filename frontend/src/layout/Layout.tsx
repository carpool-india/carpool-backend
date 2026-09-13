import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Logo } from "../components/Logo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useAuthStore } from "../store/authStore";
import { t } from "../i18n/translations";

const links = [{ href: "/#how-it-works", label: "How it works" }, { href: "/#features", label: "Why RideShare" }, { href: "/#drive", label: "For drivers" }];

export function Layout() {
  const location = useLocation();
  const landing = location.pathname === "/";
  const language = useAuthStore((state) => state.language);
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <div className={`public-layout ${landing ? "is-landing" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={`public-header ${landing ? "public-header--dark" : ""}`}>
        <div className="landing-container nav-row">
          <Logo variant={landing ? "dark" : "light"} />
          <nav className="desktop-links" aria-label="Main navigation">{landing ? links.map(link => <a key={link.href} href={link.href}>{link.label}</a>) : <><NavLink to="/search">Find a ride</NavLink><NavLink to="/post">Offer a ride</NavLink><a href="/#how-it-works">How it works</a></>}</nav>
          <div className="nav-actions"><LanguageSwitcher variant={landing ? "dark" : "light"} /><Link to={sessionToken ? "/trips" : "/login"} className="nav-login">{sessionToken ? t(language, "myTrips") : t(language, "logIn")} <span aria-hidden="true">↗</span></Link><button className="nav-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><Icon path={open ? icons.close : icons.menu} /></button></div>
        </div>
        {open && <nav id="mobile-navigation" className="mobile-links" aria-label="Mobile navigation">{links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}<Link to="/search">Find a ride</Link><Link to="/post">Offer a ride</Link></nav>}
      </header>
      <main id="main-content" className="flex-1" tabIndex={-1}><Outlet /></main>
      <footer className="public-footer"><div className="landing-container footer-grid"><div><Logo variant="dark" /><p>Good company for the road ahead.<br />Shared rides, across India.</p></div><div><h2>Let's go</h2><Link to="/search">Find a ride</Link><Link to="/post">Offer a ride</Link><Link to="/trips">My trips</Link></div><div><h2>Get to know us</h2><a href="/#how-it-works">How it works</a><a href="/#features">Why RideShare</a><a href="/#faq">Common questions</a></div><div className="footer-message">A little less solo.<br /><span>A little more together. ↗</span></div></div><div className="landing-container footer-bottom"><span>© {new Date().getFullYear()} RideShare India</span><span>Made for journeys. And the people in them.</span></div></footer>
    </div>
  );
}
