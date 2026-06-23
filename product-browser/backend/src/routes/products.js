import { Router } from "express";
import mongoose from "mongoose";
import Product, { CATEGORIES } from "../models/Product.js";
import { encodeCursor, decodeCursor } from "../utils/cursor.js";

const router = Router();

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/products
 *
 * Query params:
 *  - category: optional, one of CATEGORIES. Filters the feed.
 *  - cursor:   optional, opaque string from a previous response's
 *              `nextCursor`. Omit to get the first page (newest items).
 *  - limit:    optional, page size (default 24, max 100).
 *
 * Sort order is always newest-first: (updatedAt DESC, _id DESC).
 *
 * Cursor pagination, not skip/limit:
 *   skip/limit re-counts and re-scans N rows on every page, getting
 *   slower as the offset grows, and it shifts under you if rows are
 *   inserted/updated while you're browsing (classic page-2-shows-page-1's
 *   last-item-again bug). Cursor pagination instead asks Mongo for
 *   "everything strictly after this exact (updatedAt, _id) position",
 *   which is a direct index seek (O(log n) + page size) regardless of
 *   how deep you are, and is stable under concurrent inserts: a new
 *   product inserted with a newer updatedAt simply appears at the top
 *   of page 1 on a fresh load, it never reshuffles items you've already
 *   paged past.
 */
router.get("/", async (req, res) => {
  try {
    const { category, cursor } = req.query;

    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_PAGE_SIZE;
    limit = Math.min(limit, MAX_PAGE_SIZE);

    const query = {};

    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}`,
        });
      }
      query.category = category;
    }

    const decoded = decodeCursor(cursor);
    if (cursor && !decoded) {
      return res.status(400).json({ error: "Invalid cursor." });
    }

    if (decoded) {
      // "Strictly after" this position in (updatedAt DESC, _id DESC) order:
      // either updatedAt is older, OR updatedAt ties and _id is smaller
      // (since within a tie we walk _id descending too).
      query.$or = [
        { updatedAt: { $lt: decoded.updatedAt } },
        {
          updatedAt: decoded.updatedAt,
          _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
        },
      ];
    }

    // Fetch one extra row so we can tell whether there's a next page
    // without a separate count query.
    const docs = await Product.find(query)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? encodeCursor(page[page.length - 1]) : null;

    res.json({
      products: page,
      nextCursor,
      hasMore,
      count: page.length,
    });
  } catch (err) {
    console.error("GET /api/products failed:", err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

/**
 * GET /api/products/categories
 * Convenience endpoint so the frontend doesn't have to hardcode the list.
 */
router.get("/categories", (_req, res) => {
  res.json({ categories: CATEGORIES });
});

/**
 * POST /api/products/seed-batch
 *
 * Bonus endpoint: inserts `count` (default 50) freshly-timestamped random
 * products. Used by the frontend's "Insert 50 products" button to
 * demonstrate that cursor pagination keeps working correctly (new items
 * appear at the top on a fresh load, and already-fetched pages are
 * unaffected) even while new data is being written concurrently.
 */
router.post("/seed-batch", async (req, res) => {
  try {
    let count = parseInt(req.body?.count, 10);
    if (!Number.isFinite(count) || count <= 0) count = 50;
    count = Math.min(count, 1000);

    const now = Date.now();
    const docs = Array.from({ length: count }, (_, i) => {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      // Stagger timestamps by a few ms each so ties are rare but the
      // pagination logic is exercised either way.
      const ts = new Date(now + i);
      return {
        name: `${category} Item ${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        category,
        price: Math.round((Math.random() * 495 + 5) * 100) / 100,
        createdAt: ts,
        updatedAt: ts,
      };
    });

    const inserted = await Product.insertMany(docs, { ordered: false });

    res.status(201).json({
      insertedCount: inserted.length,
      message: `Inserted ${inserted.length} new products.`,
    });
  } catch (err) {
    console.error("POST /api/products/seed-batch failed:", err);
    res.status(500).json({ error: "Failed to insert products." });
  }
});

export default router;
