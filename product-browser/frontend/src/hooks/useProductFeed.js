import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProducts } from "../lib/api";

/**
 * Drives the "newest first, load more" product feed.
 *
 * Switching category resets the feed entirely (new cursor chain) since
 * category is part of the filter, not something you can splice into an
 * existing cursor position.
 */
export function useProductFeed(category) {
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Guards against a slow first request finishing after the user has
  // already switched category again (stale response clobbering fresh state).
  const requestIdRef = useRef(0);
  // Mirrors `cursor` so refreshNewest can check "do we have a cursor yet?"
  // synchronously, without depending on `cursor` (which would otherwise
  // force refreshNewest to be re-created, and re-fetch, on every page load).
  const cursorRef = useRef(null);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({ category, limit: 24 });
      if (requestId !== requestIdRef.current) return; // stale
      setProducts(data.products);
      setCursor(data.nextCursor);
      cursorRef.current = data.nextCursor;
      setHasMore(data.hasMore);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load products.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [category]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const requestId = requestIdRef.current;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchProducts({ category, cursor, limit: 24 });
      if (requestId !== requestIdRef.current) return; // category changed mid-flight
      setProducts((prev) => [...prev, ...data.products]);
      setCursor(data.nextCursor);
      cursorRef.current = data.nextCursor;
      setHasMore(data.hasMore);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load more products.");
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  }, [category, cursor, hasMore, loadingMore]);

  // Reset + reload whenever the category filter changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadFirstPage();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFirstPage]);

  /**
   * Re-fetches just the first page and prepends any products that aren't
   * already in the list. Used after the "Insert 50 products" demo action:
   * it proves new inserts show up via a fresh page-1 load, without
   * disturbing pages already scrolled past (no full reset, no duplicates).
   */
  const refreshNewest = useCallback(async () => {
    try {
      const data = await fetchProducts({ category, limit: 24 });
      let newIds = [];
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const fresh = data.products.filter((p) => !existingIds.has(p._id));
        if (fresh.length === 0) return prev;
        newIds = fresh.map((p) => p._id);
        return [...fresh, ...prev];
      });
      // If the feed had no cursor yet (e.g. very first load returned fewer
      // than a page), sync it now so "Load More" continues correctly.
      if (cursorRef.current === null) {
        cursorRef.current = data.nextCursor;
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
      return newIds;
    } catch {
      return [];
    }
  }, [category]);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refreshNewest,
  };
}
