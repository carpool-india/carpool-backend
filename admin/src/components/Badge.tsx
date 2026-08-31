const TONES: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-brand-light text-brand",
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-block rounded-md px-1.5 py-[1px] text-[11px] font-medium capitalize ${TONES[tone]}`}>
      {label.replace(/_/g, " ")}
    </span>
  );
}
