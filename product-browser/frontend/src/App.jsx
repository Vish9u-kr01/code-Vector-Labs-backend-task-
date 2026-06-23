import { useEffect, useState } from "react";
import { fetchCategories } from "./lib/api";
import { useProductFeed } from "./hooks/useProductFeed";
import CategorySelect from "./components/CategorySelect";
import ProductCard from "./components/ProductCard";
import ProductCardSkeleton from "./components/ProductCardSkeleton";
import LoadMoreButton from "./components/LoadMoreButton";
import InsertDemoButton from "./components/InsertDemoButton";
import ErrorBanner from "./components/ErrorBanner";

export default function App() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [recentlyInsertedIds, setRecentlyInsertedIds] = useState(new Set());

  const { products, loading, loadingMore, hasMore, error, loadMore, refreshNewest } =
    useProductFeed(category);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([]));
  }, []);

  async function handleInserted() {
    const newIds = await refreshNewest();
    if (newIds.length > 0) {
      setRecentlyInsertedIds(new Set(newIds));
      setTimeout(() => setRecentlyInsertedIds(new Set()), 6000);
    }
  }

  return (
    <div className="min-h-screen paper-grain">
      <header className="border-b border-line bg-[var(--color-paper)]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Catalog
              </p>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Product Browser
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <InsertDemoButton onInserted={handleInserted} />
              <CategorySelect categories={categories} value={category} onChange={setCategory} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-5">
            <ErrorBanner message={error} />
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-xs text-ink-soft">
              {products.length.toLocaleString()} loaded
              {category ? ` · ${category}` : ""}
            </p>
            <p className="hidden font-mono text-[11px] text-ink-soft/70 sm:block">
              sorted by updatedAt ↓, cursor-paginated
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <p className="font-display text-lg font-semibold text-ink">No products here</p>
            <p className="text-sm text-ink-soft">Try a different category, or insert some demo products.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isNew={recentlyInsertedIds.has(product._id)}
                />
              ))}
            </div>
            <LoadMoreButton onClick={loadMore} loading={loadingMore} hasMore={hasMore} />
          </>
        )}
      </main>
    </div>
  );
}
