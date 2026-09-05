import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, icons } from "./Icon";

export function Page({
  children,
  className = "",
  width = "lg",
}: {
  children: ReactNode;
  className?: string;
  width?: "sm" | "md" | "lg" | "xl" | "full";
}) {
  const max =
    width === "sm"
      ? "max-w-md"
      : width === "md"
        ? "max-w-xl"
        : width === "lg"
          ? "max-w-3xl"
          : width === "xl"
            ? "max-w-5xl"
            : "max-w-6xl";
  return <div className={`mx-auto ${max} px-5 py-8 sm:px-8 sm:py-10 ${className}`}>{children}</div>;
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker ? <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{kicker}</p> : null}
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-[2rem]">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-white shadow-card ${className}`}>{children}</div>;
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-line disabled:text-ink-faint disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-brand hover:text-brand disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "accent" | "pink" | "amber" | "emerald" | "red" | "muted";
}) {
  const tones = {
    brand: "bg-brand-light text-brand-dark",
    accent: "bg-amber-50 text-accent-dark",
    pink: "bg-pink-50 text-pink-700",
    amber: "bg-amber-50 text-amber-800",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    muted: "bg-paper text-ink-soft",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function Alert({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "brand" | "red" | "emerald";
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-800",
    brand: "bg-brand-light text-brand-dark",
    red: "bg-red-50 text-red-700",
    emerald: "bg-emerald-50 text-emerald-800",
  };
  return <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${tones[tone]}`}>{children}</div>;
}

export function Avatar({
  name,
  photoUrl,
  size = "md",
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm";
  const initial = name?.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light font-bold text-brand-dark ${box}`}>
      {photoUrl ? <img src={photoUrl} alt={name ?? "Profile"} className="h-full w-full object-cover" /> : initial}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</span>
      {children}
    </label>
  );
}

export const fieldInputClass =
  "mt-1 w-full border-b-2 border-line bg-transparent py-2 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-ink-faint focus:border-brand";

export function RouteEndpoints({
  from,
  to,
  meta,
  compact = false,
}: {
  from: string;
  to: string;
  meta?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand/15" />
        <span className="my-1 w-px flex-1 bg-gradient-to-b from-brand/50 to-accent/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent/20" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-ink ${compact ? "text-sm" : "text-base"}`}>{from}</p>
        {meta ? <p className="py-1 text-xs font-semibold text-ink-faint">{meta}</p> : <div className={compact ? "h-2" : "h-3"} />}
        <p className={`truncate font-bold text-ink ${compact ? "text-sm" : "text-base"}`}>{to}</p>
      </div>
    </div>
  );
}

export function TrustBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-extrabold text-brand-dark">
      <Icon path={icons.shield} className="h-3.5 w-3.5" />
      {score} Trust
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-light text-brand">
        <Icon path={icons.route} className="h-7 w-7" />
      </div>
      <p className="mt-4 font-display text-lg font-extrabold text-ink">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  capitalize,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  capitalize?: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-paper p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${capitalize ? "capitalize" : ""} ${
            value === option.value ? "bg-white text-brand shadow-card" : "text-ink-soft hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-paper px-4 py-3">
      <div>
        <p className="text-sm font-bold text-ink">{label}</p>
        {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-brand" : "bg-line"}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "confirmed" || status === "active" || status === "in_progress"
      ? "emerald"
      : status === "cancelled" || status === "rejected"
        ? "red"
        : status === "completed"
          ? "muted"
          : "amber";
  return <Badge tone={tone}>{status.replace("_", " ")}</Badge>;
}
