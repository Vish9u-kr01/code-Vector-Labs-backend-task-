const CATEGORY_DOTS = {
  Electronics: "#2f4d3a",
  Fashion: "#b5502f",
  Books: "#3c5a78",
  Sports: "#9a7b2f",
  Home: "#6b4d8a",
  Toys: "#b5392f",
};

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProductCard({ product, isNew }) {
  const dotColor = CATEGORY_DOTS[product.category] || "#5c5648";

  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-lg border border-line bg-white p-4 transition-shadow hover:shadow-md ${
        isNew ? "ring-2 ring-[var(--color-flag)] ring-offset-2 ring-offset-[var(--color-paper)]" : ""
      }`}
    >
      {isNew && (
        <span className="absolute -top-2 -right-2 rounded-full bg-[var(--color-flag)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          New
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: `${dotColor}1A`, color: dotColor }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
          {product.category}
        </span>
        <span className="font-mono text-[11px] text-ink-soft">{formatRelativeTime(product.updatedAt)}</span>
      </div>

      <h3 className="font-display text-base font-semibold leading-snug text-ink">{product.name}</h3>

      <div className="mt-auto flex items-baseline justify-between pt-1">
        <span className="font-mono text-lg font-semibold text-[var(--color-accent)]">
          {formatPrice(product.price)}
        </span>
        <span className="font-mono text-[10px] text-ink-soft/70" title={product._id}>
          {product._id.slice(-6)}
        </span>
      </div>
    </div>
  );
}
