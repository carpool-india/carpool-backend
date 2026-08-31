export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "critical";
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-label">{label}</div>
      <div className={`stat-tile-value ${tone === "critical" ? "stat-tile-value-critical" : ""}`}>{value}</div>
    </div>
  );
}
