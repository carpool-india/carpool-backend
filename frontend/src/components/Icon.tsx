import type { ReactNode } from "react";

export function Icon({ path, className = "h-5 w-5" }: { path: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {path}
    </svg>
  );
}

export const icons = {
  route: (
    <>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21s7-7.6 7-12.2a7 7 0 1 0-14 0C5 13.4 12 21 12 21z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3.2v4.9c0 4.7-3 8.4-7 9.6-4-1.2-7-4.9-7-9.6V6.2L12 3z" />
      <path d="M9 12.2l2 2 4-4.4" />
    </>
  ),
  score: (
    <>
      <path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.2" />
      <path d="M8 11V7.8a4 4 0 0 1 8 0V11" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 4v2.4M12 17.6V20M4 12h2.4M17.6 12H20" />
      <path d="M6.5 6.5l1.7 1.7M15.8 15.8l1.7 1.7M17.5 6.5l-1.7 1.7M8.2 15.8l-1.7 1.7" opacity="0.55" />
    </>
  ),
  chat: (
    <>
      <path d="M4 6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v5.6a2.8 2.8 0 0 1-2.8 2.8H10l-4.3 3.4v-3.4h-1A2.8 2.8 0 0 1 4 12.4V6.8z" />
      <path d="M8 8.6h8M8 11.4h5" opacity="0.6" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M6.5 17.5l11-11" />
    </>
  ),
  sos: (
    <>
      <path d="M12 3.2L2.6 20h18.8L12 3.2z" />
      <path d="M12 9.4v4.6" />
      <path d="M12 16.9v.1" strokeWidth={2.4} />
    </>
  ),
  check: (
    <>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="2.4" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  car: (
    <>
      <path d="M5 16.5V11l1.6-4.8A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.2L19 11v5.5" />
      <circle cx="8" cy="16.5" r="1.6" />
      <circle cx="16" cy="16.5" r="1.6" />
      <path d="M5 12.5h14" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  swap: (
    <>
      <path d="M7 7h11M15 4l3 3-3 3" />
      <path d="M17 17H6M9 14l-3 3 3 3" />
    </>
  ),
  star: (
    <>
      <path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3z" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.4-3.2 2.7-5.5 5.5-5.5S14.1 15.8 14.5 19" />
      <circle cx="16.5" cy="8.5" r="2.4" />
      <path d="M16.5 13.5c2.2 0 4 1.7 4.4 4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5l1.4 4.4L18 9.3l-4.6 1.4L12 15l-1.4-4.3L6 9.3l4.6-1.4L12 3.5z" />
      <path d="M18.5 14.5l.7 2.2 2.3.7-2.3.7-.7 2.2-.7-2.2-2.3-.7 2.3-.7.7-2.2z" opacity="0.7" />
    </>
  ),
  logout: (
    <>
      <path d="M10 7V5.8A1.8 1.8 0 0 1 11.8 4h6.4A1.8 1.8 0 0 1 20 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8h-6.4A1.8 1.8 0 0 1 10 18.2V17" />
      <path d="M4 12h10M10 8.5L13.5 12 10 15.5" />
    </>
  ),
  chevronDown: (
    <>
      <path d="M6 9l6 6 6-6" />
    </>
  ),
  seat: (
    <>
      <path d="M6 14V9.2A2.2 2.2 0 0 1 8.2 7h1.6A2.2 2.2 0 0 1 12 9.2V14" />
      <path d="M12 14V9.2A2.2 2.2 0 0 1 14.2 7h1.6A2.2 2.2 0 0 1 18 9.2V14" />
      <path d="M5 14h14v2.4A1.6 1.6 0 0 1 17.4 18H6.6A1.6 1.6 0 0 1 5 16.4V14z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c8-1 13-8 14-14-6 1-13 6-14 14z" />
      <path d="M8 12c2 2 4 3.5 7 4" />
    </>
  ),
};
