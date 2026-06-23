export default function LoadMoreButton({ onClick, loading, hasMore }) {
  if (!hasMore) {
    return (
      <p className="py-6 text-center font-mono text-xs uppercase tracking-wider text-ink-soft">
        — end of catalog —
      </p>
    );
  }

  return (
    <div className="flex justify-center py-6">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#243d2e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <span className="pulse-dot h-2 w-2 rounded-full bg-white" />
            Loading…
          </>
        ) : (
          "Load more"
        )}
      </button>
    </div>
  );
}
