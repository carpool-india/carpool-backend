import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Reveal } from "../components/Reveal";
import { POPULAR_ROUTES, SearchForm, toDateKey } from "../components/SearchForm";
import { resolvePlace, type MapPlace } from "../services/places";

const pillars = [
  {
    icon: icons.shield,
    title: "Verified every time",
    body: "Aadhaar, driving licence, and face-match checks — completed before anyone gets behind the wheel.",
  },
  {
    icon: icons.lock,
    title: "Fair, transparent fares",
    body: "See the price per seat upfront, and pay through escrow that only releases once the trip is done.",
  },
  {
    icon: icons.sos,
    title: "Safety built in",
    body: "Live tracking, one-tap SOS, and a safety desk that's actually watching, on every single trip.",
  },
];

const features = [
  {
    title: "Book in seconds",
    body: "Search intercity and local routes, compare live fares, and confirm a ride with driver and vehicle details before pickup.",
    icon: icons.route,
  },
  {
    title: "Verified drivers",
    body: "Every driver-partner clears Aadhaar, driving licence, and face-match verification before accepting a single ride.",
    icon: icons.shield,
  },
  {
    title: "A trust score on every profile",
    body: "KYC status, ratings, and trip history roll into one transparent score you can see before you ride together.",
    icon: icons.score,
  },
  {
    title: "Escrow-protected payments",
    body: "UPI and card payments are held securely and released automatically once a trip is confirmed complete.",
    icon: icons.lock,
  },
  {
    title: "Live trip tracking",
    body: "Share your journey with anyone you choose and follow it in real time from pickup to drop-off.",
    icon: icons.radar,
  },
  {
    title: "Chat with your driver",
    body: "Message your driver or rider right in the app before and during the trip — no phone numbers shared.",
    icon: icons.chat,
  },
  {
    title: "Block & report, instantly",
    body: "One tap blocks or reports anyone on the platform — reviewed by our safety desk, no waiting required.",
    icon: icons.block,
  },
  {
    title: "In-trip SOS",
    body: "One tap alerts your emergency contacts and our safety desk with your live location, day or night.",
    icon: icons.sos,
  },
];

const steps = [
  { step: "01", title: "Enter your route", body: "Tell us where you're starting and where you're headed." },
  { step: "02", title: "Pick a ride", body: "Compare available drivers, vehicles, and fares in real time." },
  { step: "03", title: "Confirm & pay", body: "Pay securely by UPI or card — funds release after the trip." },
  { step: "04", title: "Ride safely", body: "Check the driver and vehicle, chat if you need to, and track the journey live." },
];

const cities = ["Chennai", "Bengaluru", "Coimbatore", "Madurai", "Pondicherry", "Hyderabad", "Kochi", "Tiruchirappalli", "Salem", "Vellore"];

const popularRouteCards = [
  { from: "Chennai", to: "Bengaluru", time: "5–6 hrs", hint: "IT corridor favourite" },
  { from: "Chennai", to: "Pondicherry", time: "3 hrs", hint: "Weekend getaway" },
  { from: "Coimbatore", to: "Chennai", time: "7 hrs", hint: "Hill-to-coast" },
  { from: "Madurai", to: "Chennai", time: "7–8 hrs", hint: "Temple city run" },
];

const testimonials = [
  {
    quote: "I used to hesitate sharing a cab out of the city. Seeing KYC and a trust score before I book changed that overnight.",
    name: "Priya S.",
    role: "Rider · Chennai",
  },
  {
    quote: "Empty seats on my Coimbatore run now actually pay for fuel. Passengers are verified, and payout lands after the trip.",
    name: "Karthik M.",
    role: "Driver-partner · Coimbatore",
  },
  {
    quote: "Live tracking plus a real SOS button is what I needed to let my parents know I was on the highway. Simple, and it works.",
    name: "Ananya R.",
    role: "Rider · Bengaluru",
  },
];

const faqs = [
  {
    q: "How do I book a ride?",
    a: "Search your route, compare available drivers, vehicles, and fares, then confirm your seat and pay by UPI or card. Your payment is held in escrow until the trip is marked complete.",
  },
  {
    q: "How is my driver verified?",
    a: "Every driver-partner completes Aadhaar, driving licence, and face-match verification before they can accept a single ride — you can see their KYC status and trust score right on their profile.",
  },
  {
    q: "What happens to my payment?",
    a: "UPI and card payments are held securely in escrow and released automatically once the trip is confirmed complete — never paid out to the driver upfront.",
  },
  {
    q: "What if something feels wrong on a trip?",
    a: "You can message your driver in-app, block or report anyone with one tap, or trigger in-trip SOS to alert your emergency contacts and our safety desk with your live location.",
  },
  {
    q: "How do I become a driver-partner?",
    a: "Complete KYC verification, add your vehicle details, and choose a driver plan — then you can publish rides and set your own price per seat.",
  },
];

function SearchWidget() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<MapPlace | null>(null);
  const [destination, setDestination] = useState<MapPlace | null>(null);
  const [date, setDate] = useState(toDateKey(new Date()));
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function handleSearch() {
    if (!origin || !destination) {
      setError("Choose both a from and to location");
      return;
    }
    setError(null);
    navigate("/search", { state: { origin, destination, date, seats } });
  }

  async function pickPopular(from: string, to: string) {
    const [a, b] = await Promise.all([resolvePlace(`local:${from.toLowerCase()}`), resolvePlace(`local:${to.toLowerCase()}`)]);
    setOrigin(a);
    setDestination(b);
  }

  return (
    <div className="mt-8">
      <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)] sm:p-5">
        <SearchForm
          origin={origin}
          destination={destination}
          date={date}
          seats={seats}
          onOrigin={setOrigin}
          onDestination={setDestination}
          onDate={setDate}
          onSeats={setSeats}
          onSubmit={handleSearch}
          error={error}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-white/70">Popular</span>
        {POPULAR_ROUTES.map(([a, b]) => (
          <button
            key={`${a}-${b}`}
            type="button"
            onClick={() => void pickPopular(a, b)}
            className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-white hover:text-ink"
          >
            {a} → {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ink">
      <img src="/images/hero-highway.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="hero-scrim absolute inset-0" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-6 pb-16 pt-28 sm:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Onboarding across India
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.15rem]">
            Go further.
            <br />
            Ride verified.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Intercity and local seats with KYC-checked drivers, escrow-protected UPI, and a safety desk on every trip.
          </p>
          <SearchWidget />
          <p className="mt-5 text-sm font-semibold text-white/75">
            Driving instead?{" "}
            <a href="#drive" className="text-accent underline-offset-2 hover:underline">
              Share empty seats and cut your costs →
            </a>
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          {["Aadhaar + DL verified", "UPI escrow", "Live GPS", "24×7 SOS"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/90 backdrop-blur"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CityMarquee() {
  const loop = [...cities, ...cities];
  return (
    <div className="overflow-hidden border-y border-line/70 bg-white py-4">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap px-6 text-sm font-bold text-ink-faint">
        {loop.map((city, i) => (
          <span key={`${city}-${i}`} className="inline-flex items-center gap-10">
            <span>{city}</span>
            <span className="h-1 w-1 rounded-full bg-brand/40" />
          </span>
        ))}
      </div>
    </div>
  );
}

function Pillars() {
  return (
    <section className="bg-paper-card py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 80} className="rounded-3xl border border-line/80 bg-paper p-6 text-center sm:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white sm:mx-0">
              <Icon path={p.icon} />
            </div>
            <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{p.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="border-t border-line/70 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Why RideShare</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Built for trust, not just speed</h2>
          <p className="mt-3 text-ink-soft">
            Every part of the ride — booking, payment, pickup, and the trip itself — is designed around verifying who you're riding
            with.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 60}>
              <div className="h-full rounded-3xl border border-line bg-paper-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-floating">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-brand-dark">
                  <Icon path={feature.icon} />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line/70 bg-paper-card py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Four steps</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">How it works</h2>
        </Reveal>
        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-line lg:block" aria-hidden="true" style={{ marginInline: "12.5%" }} />
          {steps.map((item, i) => (
            <Reveal key={item.step} delay={i * 80} className="relative text-center lg:text-left">
              <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand bg-paper-card text-sm font-extrabold text-brand lg:mx-0">
                {item.step}
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularRoutes() {
  const navigate = useNavigate();

  async function go(from: string, to: string) {
    const [origin, destination] = await Promise.all([
      resolvePlace(`local:${from.toLowerCase()}`),
      resolvePlace(`local:${to.toLowerCase()}`),
    ]);
    navigate("/search", { state: { origin, destination, date: toDateKey(new Date()), seats: 1 } });
  }

  return (
    <section className="border-t border-line/70 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Go somewhere</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Popular routes</h2>
          </div>
          <Link to="/search" className="text-sm font-bold text-brand hover:underline">
            Search any city →
          </Link>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularRouteCards.map((route, i) => (
            <Reveal key={`${route.from}-${route.to}`} delay={i * 60}>
              <button
                type="button"
                onClick={() => void go(route.from, route.to)}
                className="group relative w-full overflow-hidden rounded-3xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-1 hover:shadow-floating"
              >
                <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-brand to-accent" />
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{route.hint}</p>
                <p className="mt-3 font-display text-xl font-extrabold text-ink">
                  {route.from}
                  <span className="mx-1.5 text-brand">→</span>
                  {route.to}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-soft">{route.time}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const driverPerks = [
  { icon: icons.wallet, text: "Set your own price per seat" },
  { icon: icons.lock, text: "Get paid straight after each trip, via escrow" },
  { icon: icons.shield, text: "Ride only with KYC-verified passengers" },
];

function DriverBand() {
  return (
    <section id="drive" className="relative overflow-hidden border-t border-line/70 bg-ink py-24">
      <img src="/images/hero-highway.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/70" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="text-center lg:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200">For drivers</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Share your ride. Cut your costs.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70 lg:mx-0">
            Got empty seats on a trip you're already making? Publish your ride and let verified passengers split the fuel and toll
            cost with you.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-teal-700"
          >
            Become a driver-partner
            <Icon path={icons.arrowRight} className="h-4 w-4" />
          </Link>
        </Reveal>
        <Reveal delay={100} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <ul className="space-y-4">
            {driverPerks.map((perk) => (
              <li key={perk.text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
                  <Icon path={perk.icon} className="h-4 w-4" />
                </span>
                {perk.text}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-line/70 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">From the road</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Riders and drivers, both covered</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <Reveal key={item.name} delay={i * 80}>
              <figure className="flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-card">
                <Icon path={icons.sparkle} className="h-5 w-5 text-accent" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">“{item.quote}”</blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <p className="text-sm font-bold text-ink">{item.name}</p>
                  <p className="text-xs font-semibold text-ink-faint">{item.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-line py-5">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="font-display text-base font-bold text-ink">{q}</span>
        <Icon path={icons.plus} className={`h-5 w-5 shrink-0 text-brand transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
      </button>
      <div className={`grid overflow-hidden transition-all duration-200 ${isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <p className="overflow-hidden max-w-2xl text-sm leading-relaxed text-ink-soft">{a}</p>
      </div>
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-line/70 bg-paper-card py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Support</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Common questions</h2>
        </Reveal>
        <div className="mt-10">
          {faqs.map((item, i) => (
            <FAQItem
              key={item.q}
              q={item.q}
              a={item.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreBadge({ store }: { store: "apple" | "google" }) {
  const isApple = store === "apple";
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-disabled="true"
      className="flex items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-white shadow-card transition hover:-translate-y-0.5 hover:bg-black"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-white" aria-hidden="true">
        {isApple ? (
          <path d="M15.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.6.9-.7 0-1.9-.8-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.9-.4 7.1 1.2 9.4.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7 1.4 0 1.8.7 3.1.7 1.3 0 2-1.2 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1-.1-2.4-1-2.4-3.9zM13.7 5.3c.6-.8 1.1-1.9 1-3-.9.1-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z" />
        ) : (
          <path d="M6 4.3v15.4a1 1 0 0 0 1.5.8l13-7.7a1 1 0 0 0 0-1.6l-13-7.7A1 1 0 0 0 6 4.3z" />
        )}
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[9px] font-medium uppercase tracking-wide text-white/60">
          {isApple ? "Download on the" : "GET IT ON"}
        </span>
        <span className="block font-display text-sm font-bold">{isApple ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

function Download() {
  return (
    <section id="download" className="border-t border-line/70 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <Reveal className="max-w-lg">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">Take RideShare India with you</h2>
          <p className="mt-3 text-ink-soft">
            Book, track, and pay for every ride from your phone. The app is on its way to both stores — these links go live the
            moment it lands.
          </p>
        </Reveal>
        <Reveal delay={80} className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <StoreBadge store="apple" />
            <span className="text-[11px] font-semibold text-ink-faint">Coming soon</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <StoreBadge store="google" />
            <span className="text-[11px] font-semibold text-ink-faint">Coming soon</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-line/70 bg-ink py-24">
      <img src="/images/auth-night-drive.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-ink/80" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Ready to ride, or ready to drive?</h2>
          <p className="mt-3 text-white/70">
            Search a verified trip in seconds, or publish the seats you're already driving.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:bg-teal-700"
            >
              Find a ride
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-brand-light"
            >
              Log in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <CityMarquee />
      <Pillars />
      <HowItWorks />
      <PopularRoutes />
      <Features />
      <DriverBand />
      <Testimonials />
      <FAQ />
      <Download />
      <FinalCta />
    </>
  );
}
