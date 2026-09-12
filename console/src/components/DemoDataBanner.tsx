export function DemoDataBanner({ context }: { context: string }) {
  return (
    <div className="demo-data-banner" role="status">
      <span className="demo-data-banner-dot" aria-hidden />
      <span>
        Showing demo data — live {context} data is unavailable.
      </span>
    </div>
  );
}
