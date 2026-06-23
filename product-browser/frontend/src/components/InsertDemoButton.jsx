import { useState } from "react";
import { insertRandomProducts } from "../lib/api";

export default function InsertDemoButton({ onInserted }) {
  const [busy, setBusy] = useState(false);
  const [justInserted, setJustInserted] = useState(0);

  async function handleClick() {
    setBusy(true);
    try {
      const result = await insertRandomProducts(50);
      setJustInserted(result.insertedCount);
      await onInserted();
      setTimeout(() => setJustInserted(0), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-flag)] bg-[var(--color-flag)] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#9c4226] disabled:cursor-not-allowed disabled:opacity-60"
        title="Inserts 50 brand-new products with fresh timestamps, then refreshes the feed — proving the pagination cursor stays correct even while data changes underneath it."
      >
        {busy ? (
          <>
            <span className="pulse-dot h-2 w-2 rounded-full bg-white" />
            Inserting…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Insert 50 products
          </>
        )}
      </button>
      {justInserted > 0 && (
        <span className="text-sm font-medium text-[var(--color-accent)]">
          +{justInserted} added — scroll up, they're at the top
        </span>
      )}
    </div>
  );
}
