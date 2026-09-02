import type { ReactNode } from "react";

type IconName =
  | "overview"
  | "safety"
  | "users"
  | "kyc"
  | "vehicles"
  | "trips"
  | "bookings"
  | "plans"
  | "payments"
  | "ratings"
  | "reports";

const PATHS: Record<IconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  safety: (
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.2c2 .4 3.6 1.8 4.2 4.3" />
    </>
  ),
  kyc: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  vehicles: (
    <>
      <path d="M4 16h16M6 16V9.5L8.5 6h7L18 9.5V16" />
      <circle cx="7.5" cy="16" r="1.6" />
      <circle cx="16.5" cy="16" r="1.6" />
    </>
  ),
  trips: (
    <>
      <path d="M4 16h16M6 16V9.5L8.5 6h7L18 9.5V16" />
      <circle cx="7.5" cy="16" r="1.6" />
      <circle cx="16.5" cy="16" r="1.6" />
      <path d="M8.5 6v3.5h7V6" />
    </>
  ),
  bookings: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  plans: (
    <>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M16 4v4h4M9 13h6M9 17h4" />
    </>
  ),
  payments: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </>
  ),
  ratings: (
    <path d="M12 3.5 14.6 9l6 .7-4.4 4 1.2 5.8L12 16.8 6.6 19.5 7.8 13.7 3.4 9.7 9.4 9 12 3.5Z" />
  ),
  reports: (
    <>
      <path d="M6 3v18" />
      <path d="M6 4h11l-2.5 3.5L17 11H6" />
    </>
  ),
};

export function NavIcon({ name }: { name: IconName }) {
  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
