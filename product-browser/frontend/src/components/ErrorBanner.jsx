export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-[var(--color-flag)]/40 bg-[var(--color-flag)]/10 px-4 py-3 text-sm text-[var(--color-flag)]">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-md border border-[var(--color-flag)]/50 px-2.5 py-1 text-xs font-medium text-[var(--color-flag)] hover:bg-[var(--color-flag)]/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}
