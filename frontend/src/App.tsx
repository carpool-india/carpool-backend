const features = [
  {
    title: "Book in seconds",
    body: "Search intercity and local routes, compare fares, and confirm a ride with driver and vehicle details shared before pickup.",
  },
  {
    title: "Verified drivers",
    body: "Every driver-partner completes KYC and vehicle document verification before they can accept a single ride.",
  },
  {
    title: "Escrow payments",
    body: "UPI and card payments are held securely and released automatically once the trip is confirmed complete.",
  },
  {
    title: "Live tracking",
    body: "Share your trip with anyone and follow the ride in real time from pickup to drop-off.",
  },
  {
    title: "OTP-verified pickups",
    body: "Every trip starts with a one-time code shared only between rider and driver, so you always know it's the right car.",
  },
  {
    title: "In-trip SOS",
    body: "One tap alerts your emergency contacts and our safety desk with your live location.",
  },
];

const steps = [
  { step: "01", title: "Enter your route", body: "Tell us where you're starting and where you're headed." },
  { step: "02", title: "Pick a ride", body: "Compare available drivers, vehicles, and fares in real time." },
  { step: "03", title: "Confirm & pay", body: "Pay securely by UPI or card — funds are released after the trip." },
  { step: "04", title: "Ride safely", body: "Verify your driver with the trip OTP and track the journey live." },
];

function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          RideShare <span className="text-brand">India</span>
        </span>
        <a
          href="#contact"
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Get in touch
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-light px-4 py-1 text-sm font-semibold text-brand-dark">
          Now onboarding riders and drivers across India
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Verified rides, honest fares, safer journeys.
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          RideShare India connects you with KYC-verified drivers for intercity and local trips —
          with live tracking, escrow-protected payments, and OTP-verified pickups on every ride.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contact"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Join as a rider
          </a>
          <a
            href="#contact"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
          >
            Drive with us
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Built for trust, not just speed</h2>
          <p className="mt-3 text-slate-600">
            Every part of the ride — booking, payment, pickup, and the trip itself — is designed around
            verifying who you're riding with.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">How it works</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step}>
              <span className="text-sm font-bold text-brand">{item.step}</span>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-t border-slate-100 bg-slate-900 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Ready to ride, or ready to drive?</h2>
        <p className="mt-3 text-slate-300">
          Reach out and we'll get you set up — as a rider looking for verified trips, or a driver-partner
          ready to onboard.
        </p>
        <a
          href="mailto:hello@rideshareindia.example"
          className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          hello@rideshareindia.example
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} RideShare India. All rights reserved.
      </div>
    </footer>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Contact />
      <Footer />
    </div>
  );
}
