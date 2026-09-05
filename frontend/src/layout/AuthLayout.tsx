import { Outlet } from "react-router-dom";
import { Logo } from "../components/Logo";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F7F3EB] lg:grid lg:grid-cols-[1.12fr_0.88fr]">
      <aside className="relative h-[38vh] min-h-[240px] overflow-hidden lg:h-auto lg:min-h-screen">
        <img
          src="/images/auth-night-drive.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/10 lg:bg-gradient-to-r lg:from-ink/85 lg:via-ink/45 lg:to-ink/15" />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-12">
          <Logo to="/" variant="dark" />
          <div className="hidden max-w-md pb-4 text-white lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">RideShare India</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              Empty seats.
              <br />
              Verified people.
              <br />
              Honest fares.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              KYC on every driver. Escrow on every payment. SOS on every trip.
            </p>
          </div>
        </div>
      </aside>
      <main className="relative z-10 -mt-10 flex min-h-[62vh] flex-col rounded-t-[2rem] bg-[#F7F3EB] shadow-[0_-18px_50px_rgba(11,33,31,0.18)] lg:mt-0 lg:min-h-screen lg:rounded-none lg:shadow-none">
        <Outlet />
      </main>
    </div>
  );
}
