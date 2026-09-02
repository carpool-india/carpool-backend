import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, icons } from "../components/Icon";
import { Reveal } from "../components/Reveal";
import { PlaceInput } from "../components/PlaceInput";
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
  { step: "04", title: "Ride safely", body: "Check the driver and vehicle details, chat if you need to, and track the journey live." },
];

const popularRoutes: [string, string][] = [
  ["Chennai", "Bengaluru"],
  ["Chennai", "Pondicherry"],
  ["Coimbatore", "Chennai"],
  ["Madurai", "Chennai"],
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

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function SearchWidget() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<MapPlace | null>(null);
  const [destination, setDestination] = useState<MapPlace | null>(null);
  const [date, setDate] = useState(toDateKey(new Date()));
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!origin || !destination) {
      setError("Choose both a from and to location");
      return;
    }
    setError(null);
    navigate("/search", { state: { origin, destination, date, seats } });
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-white p-4 shadow-floating sm:p-5">
      <form onSubmit={handleSearch} className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-[1.15fr_1.15fr_0.9fr_0.55fr]">
        <PlaceInput label="From" placeholder="City or place" place={origin} onSelect={setOrigin} />
        <PlaceInput label="To" placeholder="City or place" place={destination} onSelect={setDestination} />
        <label className="text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Date</span>
          <input
            type="date"
            value={date}
            min={toDateKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full border-b-2 border-line bg-transparent py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
          />
        </label>
        <label className="text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-faint">Seats</span>
          <input
            type="number"
            min={1}
            max={6}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="mt-1 w-full border-b-2 border-line bg-transparent py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          className="col-span-2 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark sm:col-span-4"
        >
          Search rides
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className="text-xs font-semibold text-ink-faint">Popular:</span>
        {popularRoutes.map(([a, b]) => (
          <button
            key={`${a}-${b}`}
            type="button"
            onClick={() => {
              void resolvePlace(`local:${a.toLowerCase()}`).then(setOrigin);
              void resolvePlace(`local:${b.toLowerCase()}`).then(setDestination);
            }}
            className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
          >
            {a} → {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-brand/10 blur-2xl" aria-hidden="true" />
      <svg
        className="pointer-events-none absolute -inset-x-16 -inset-y-10 -z-10 hidden sm:block"
        viewBox="0 0 420 480"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 40c80 0 60 90 140 90s60-100 150-80 90 160 40 220-180 30-170 130"
          stroke="#0F766E"
          strokeOpacity="0.15"
          strokeWidth="3"
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
      </svg>
      <div className="rounded-[2.4rem] border border-line bg-ink p-2.5 shadow-floating">
        <div className="overflow-hidden rounded-[2rem] bg-paper-card">
          <div className="flex items-center justify-between bg-brand px-5 pb-8 pt-4 text-white">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-teal-100">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live
            </div>
            <span className="text-[11px] font-semibold text-teal-100">9:41</span>
          </div>

          <div className="-mt-5 space-y-3 px-4 pb-5">
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                <span className="text-[12px] font-semibold text-ink">Thoraipakkam</span>
              </div>
              <div className="my-1.5 ml-[3px] h-3 border-l-2 border-dotted border-line" />
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span className="text-[12px] font-semibold text-ink">Velachery, Chennai</span>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-3 shadow-card">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-ink">Arjun · Swift Dzire</p>
                  <p className="text-[11px] text-ink-faint">TN 09 · 2 seats left</p>
                </div>
                <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-extrabold text-brand-dark">
                  92 Trust
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                <span className="relative flex items-center gap-1.5 text-[11px] font-semibold text-brand">
                  <span className="gps-dot relative h-1.5 w-1.5 rounded-full bg-brand" />
                  Tracking live
                </span>
                <span className="text-[13px] font-extrabold text-ink">₹340</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white p-3 shadow-card">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                A
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-ink">Arjun</p>
                <p className="truncate text-[11px] text-ink-faint">On my way, 3 mins away</p>
              </div>
              <Icon path={icons.chat} className="h-4 w-4 shrink-0 text-brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-8 top-16 hidden rotate-2 rounded-2xl border border-line bg-white p-3 shadow-card sm:block">
        <div className="flex items-center gap-2">
          <Icon path={icons.sos} className="h-4 w-4 text-accent-dark" />
          <p className="text-[11px] font-bold text-ink">SOS · one tap away</p>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-mesh">
      <div className="mx-auto grid max-w-6xl items-start gap-16 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-dark shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Now onboarding riders and drivers across India
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            Verified rides,{" "}
            <span className="relative inline-block">
              honest fares
              <svg
                className="absolute -bottom-1.5 left-0 h-2.5 w-full"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 8c30-8 60-8 90 0s70 8 106 0" fill="none" stroke="#F0A93C" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
            , safer journeys.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft lg:mx-0">
            Tell us your route and we'll match you with KYC-verified drivers — live tracking and
            escrow-protected payments on every trip.
          </p>
          <SearchWidget />
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            Driving instead?{" "}
            <a href="#drive" className="text-brand underline-offset-2 hover:underline">
              Share your ride and cut your costs →
            </a>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-ink-faint lg:justify-start">
            <span>Aadhaar + DL verified</span>
            <span className="hidden h-1 w-1 rounded-full bg-line sm:block" />
            <span>UPI escrow payments</span>
            <span className="hidden h-1 w-1 rounded-full bg-line sm:block" />
            <span>24×7 safety desk</span>
          </div>
        </div>
        <Reveal className="flex justify-center">
          <PhoneMock />
        </Reveal>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="border-t border-line/70 bg-paper-card py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 sm:grid-cols-3">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 80} className="text-center sm:text-left">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-dark sm:mx-0">
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
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">Built for trust, not just speed</h2>
          <p className="mt-3 text-ink-soft">
            Every part of the ride — booking, payment, pickup, and the trip itself — is designed around
            verifying who you're riding with.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 60}>
              <div className="h-full rounded-2xl border border-line bg-paper-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-floating">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
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
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
        </Reveal>
        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute left-0 right-0 top-5 hidden h-px bg-line lg:block"
            aria-hidden="true"
            style={{ marginInline: "12.5%" }}
          />
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

const driverPerks = [
  { icon: icons.wallet, text: "Set your own price per seat" },
  { icon: icons.lock, text: "Get paid straight after each trip, via escrow" },
  { icon: icons.shield, text: "Ride only with KYC-verified passengers" },
];

function DriverBand() {
  return (
    <section id="drive" className="border-t border-line/70 bg-ink py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="text-center lg:text-left">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Share your ride. Cut your costs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70 lg:mx-0">
            Got empty seats on a trip you're already making? Publish your ride and let verified
            passengers split the fuel and toll cost with you.
          </p>
          <a
            href="#contact"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark"
          >
            Become a driver-partner
          </a>
        </Reveal>
        <Reveal delay={100} className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <ul className="space-y-4">
            {driverPerks.map((perk) => (
              <li key={perk.text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-teal-300">
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

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-line py-5">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="font-display text-base font-bold text-ink">{q}</span>
        <Icon
          path={icons.plus}
          className={`h-5 w-5 shrink-0 text-brand transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
        />
      </button>
      {isOpen && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{a}</p>}
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-line/70 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">Common questions</h2>
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
      // TODO: replace "#" with the real App Store / Play Store listing link once published.
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
    <section id="download" className="border-t border-line/70 bg-paper-card py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <Reveal className="max-w-lg">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">Take RideShare India with you</h2>
          <p className="mt-3 text-ink-soft">
            Book, track, and pay for every ride from your phone. The app is on its way to both stores —
            these links go live the moment it lands.
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

function Contact() {
  return (
    <section id="contact" className="border-t border-line/70 bg-ink py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Ready to ride, or ready to drive?
          </h2>
          <p className="mt-3 text-white/70">
            Reach out and we'll get you set up — as a rider looking for verified trips, or a driver-partner
            ready to onboard.
          </p>
          <a
            href="mailto:hello@rideshareindia.example"
            className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-dark"
          >
            hello@rideshareindia.example
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <Pillars />
      <Features />
      <HowItWorks />
      <DriverBand />
      <FAQ />
      <Download />
      <Contact />
    </>
  );
}
