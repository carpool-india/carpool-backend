import { Link } from "react-router-dom";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-card ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]">
        <path
          d="M4.8 14.2h14.4M7 14.2l1.4-4.1A1.6 1.6 0 0 1 9.9 9h4.2a1.6 1.6 0 0 1 1.5 1.1l1.4 4.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="16.4" r="1.35" fill="currentColor" />
        <circle cx="15.8" cy="16.4" r="1.35" fill="currentColor" />
        <path
          d="M12 4.2v3.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 4.2c1.6 0 2.6 1.1 2.6 2.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  to = "/",
  variant = "light",
  compact = false,
  className = "",
}: {
  to?: string;
  variant?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  const word = variant === "dark" ? "text-white" : "text-ink";
  const accent = variant === "dark" ? "text-teal-200" : "text-brand";

  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9" />
      {compact ? (
        <span className="sr-only">RideShare India</span>
      ) : (
        <span className={`font-display text-[1.05rem] font-extrabold tracking-tight ${word}`}>
          RideShare <span className={accent}>India</span>
        </span>
      )}
    </Link>
  );
}
