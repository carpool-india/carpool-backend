import { useAuthStore } from "../store/authStore";
import { t } from "../i18n/translations";
import { Link } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { JourneyScene } from "../components/JourneyScene";
import { Reveal } from "../components/Reveal";

const benefits = [
  { icon: icons.wallet, number: "01", title: "Share the ride.\nSplit the cost.", body: "Make room for more plans. Share fuel and toll costs on journeys you're already making.", className: "benefit-lime" },
  { icon: icons.shield, number: "02", title: "Get to know who's\ngoing your way.", body: "Check profiles, verification status, and ratings before you decide who to travel with.", className: "benefit-cream" },
  { icon: icons.leaf, number: "03", title: "More company.\nFewer cars.", body: "An empty seat is an opportunity. Make better use of every journey, one shared ride at a time.", className: "benefit-green" },
];
const steps = [
  { icon: icons.route, title: "Find your people", body: "Head to Find a ride, enter your route and date, and explore available rides." },
  { icon: icons.users, title: "Make a connection", body: "Compare profiles and fares, reserve your seat, and coordinate your pickup in chat." },
  { icon: icons.car, title: "Enjoy the journey", body: "Meet at your pickup point, follow your trip live, and pay the driver directly by UPI or cash." },
];
const faqs = [
  ["How does RideShare work?", "RideShare connects drivers with people travelling in the same direction. Use Find a ride to choose your route, travel date, and seats. Review available rides, then sign in to book."],
  ["How do payments work?", "You pay the ride fare directly to the driver by UPI or cash. A separate platform fee is collected when booking, unless your active passenger plan waives it. Review the breakdown before confirming."],
  ["Can I offer a ride in my own car?", "Yes. Sign in, complete the required verification, add your vehicle, and choose a driver plan. You can then publish a route, departure time, available seats, and price per seat."],
  ["What safety features are available?", "You can review verification status and trust scores, coordinate through in-app chat, and access live tracking and SOS during a trip. Always check that the driver and vehicle match your booking."],
];

export function LandingPage() {
  const language = useAuthStore(state => state.language);
  return (
    <div className="landing-page" data-language={language}>
      <section className="landing-hero">
        <div className="landing-container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> {t(language, "landingEyebrow")}</p>
            <h1>{t(language, "landingTitle1")}<br />{t(language, "landingTitle2")}<br /><em>{t(language, "landingTitle3")}</em></h1>
            <p className="hero-description">{t(language, "landingDescription")}</p>
            <div className="hero-actions">
              <Link to="/search" className="button-lime">{t(language, "findRide")} <Icon path={icons.arrowRight} /></Link>
              <Link to="/post" className="button-outline">{t(language, "offerRide")} <Icon path={icons.plus} /></Link>
            </div>
            <div className="hero-assurances"><span><Icon path={icons.shield} /> Profiles you can check</span><span><Icon path={icons.wallet} /> Fares upfront</span></div>
          </div>
          <JourneyScene />
        </div>
        <div className="hero-bottom landing-container"><span>LESS SOLO. MORE SHARED.</span><a href="#how-it-works">Meet your next way to travel <span aria-hidden="true">↓</span></a><span className="hero-coordinate">MADE FOR INDIA ↗</span></div>
      </section>
      <section className="journey-strip" aria-label="Ways to share a ride"><div className="landing-container"><span>One platform. A world of plans.</span><p><Icon path={icons.car} /> Daily commutes</p><span className="strip-dot">✳</span><p><Icon path={icons.route} /> City-to-city trips</p><span className="strip-dot">✳</span><p><Icon path={icons.leaf} /> Weekend escapes</p></div></section>
      <section id="features" className="landing-section landing-container">
        <Reveal className="section-heading"><div><p className="eyebrow">SMALL CHANGE. BETTER JOURNEYS.</p><h2>Going together<br />just makes sense.</h2></div><p>Less spent on getting there.<br />More to enjoy when you arrive.</p></Reveal>
        <div className="benefit-grid">{benefits.map((item, i) => <Reveal key={item.number} delay={i * 70} className={`benefit-card ${item.className}`}><div className="benefit-top"><span className="sculpted-icon"><Icon path={item.icon} className="h-8 w-8" /></span><span>{item.number}</span></div><h3>{item.title}</h3><p>{item.body}</p></Reveal>)}</div>
      </section>
      <section id="how-it-works" className="how-section"><div className="landing-container landing-section"><Reveal className="section-heading"><div><p className="eyebrow">FROM LET'S GO TO HERE WE ARE</p><h2>Your next ride.<br />Three easy steps.</h2></div><Link to="/search" className="text-link">Let's get you moving <Icon path={icons.arrowRight} /></Link></Reveal><div className="steps-grid">{steps.map((step, i) => <Reveal key={step.title} delay={i * 80} className="step-card"><div className="step-number">0{i + 1}<Icon path={step.icon} className="h-6 w-6" /></div><h3>{step.title}</h3><p>{step.body}</p></Reveal>)}</div></div></section>
      <section id="drive" className="landing-container landing-section"><Reveal className="driver-panel"><div><p className="eyebrow">YOUR CAR. A LITTLE MORE POSSIBILITY.</p><h2>Empty seats?<br /><em>Good things fit there.</em></h2><p>You're already making the trip. Open up your seats, meet people along the way, and share the cost of getting there.</p><Link to="/post" className="button-lime">Offer your first ride <Icon path={icons.arrowRight} /></Link></div><div className="driver-visual" aria-hidden="true"><div className="seat-orbit"/><div className="seat-tile seat-tile--one"><Icon path={icons.person} className="h-12 w-12"/><span>You</span></div><div className="seat-tile seat-tile--two"><Icon path={icons.plus} className="h-12 w-12"/><span>A new connection</span></div><div className="seat-tile seat-tile--three"><Icon path={icons.plus} className="h-12 w-12"/><span>A shared story</span></div><span className="driver-caption">ROOM FOR MORE THAN LUGGAGE.</span></div></Reveal></section>
      <section id="faq" className="landing-container faq-section"><Reveal><p className="eyebrow">A FEW THINGS BEFORE YOU GO</p><h2>Glad you asked.</h2><p className="mt-5 text-ink-soft">A little clarity for the road ahead.</p></Reveal><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span className="faq-plus" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="closing-section"><div className="landing-container"><span className="closing-star" aria-hidden="true">✳</span><h2>The best part?<br />We're going the same way.</h2><Link to="/search" className="button-dark">Find your next ride <Icon path={icons.arrowRight} /></Link><p>A shared journey starts with a simple hello.</p></div></section>
    </div>
  );
}
