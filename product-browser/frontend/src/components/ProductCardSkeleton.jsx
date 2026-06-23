export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-[var(--color-line)]/60" />
        <div className="h-3 w-10 rounded bg-[var(--color-line)]/60" />
      </div>
      <div className="h-4 w-3/4 rounded bg-[var(--color-line)]/60" />
      <div className="mt-auto flex items-baseline justify-between pt-1">
        <div className="h-5 w-16 rounded bg-[var(--color-line)]/60" />
        <div className="h-3 w-10 rounded bg-[var(--color-line)]/40" />
      </div>
    </div>
  );
}
