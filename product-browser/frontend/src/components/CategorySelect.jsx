const ALL_VALUE = "";

export default function CategorySelect({ categories, value, onChange }) {
  return (
    <label className="flex items-center gap-2 font-display text-sm font-medium text-ink">
      <span className="hidden sm:inline text-ink-soft font-body">Category</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-line bg-white px-3 py-2 pr-8 text-sm font-medium text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] cursor-pointer"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235c5648'><path d='M5.5 7.5l4.5 4.5 4.5-4.5' stroke='%235c5648' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.6rem center",
          backgroundSize: "1rem",
        }}
      >
        <option value={ALL_VALUE}>All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
