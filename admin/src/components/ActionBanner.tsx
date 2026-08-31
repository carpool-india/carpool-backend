export function ActionBanner({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) {
    return null;
  }
  return (
    <div className="action-banner" role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} className="action-banner-close">
        Dismiss
      </button>
    </div>
  );
}
