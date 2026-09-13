import { GhostButton } from "./ui";

export function DataFeedback({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) return <div className="resource-loading" role="status" aria-label="Loading"><div className="skeleton h-24 rounded-2xl" /><div className="skeleton h-24 rounded-2xl" /></div>;
  if (error) return <div className="resource-error" role="alert"><div><strong>We couldn't load this information.</strong><p>{error}</p></div><GhostButton onClick={onRetry}>Try again</GhostButton></div>;
  return null;
}

