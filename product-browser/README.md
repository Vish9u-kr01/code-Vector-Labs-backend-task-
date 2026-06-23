# Product Browser

A full-stack product catalog browser built to handle 200,000+ products without slowing down as users page deeper into the list.

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose

```
product-browser/
├── backend/                  Express API + MongoDB models + seed scripts
│   ├── src/
│   │   ├── config/db.js          Mongoose connection
│   │   ├── models/Product.js     Product schema + the two required indexes
│   │   ├── routes/products.js    GET /api/products, /categories, POST /seed-batch
│   │   ├── scripts/seed.js       Generates 200,000 products via insertMany
│   │   ├── scripts/insertMore.js CLI helper to insert N more products
│   │   ├── utils/cursor.js       Cursor encode/decode helpers
│   │   ├── app.js                Express app wiring
│   │   └── server.js             Entry point
│   ├── .env.example
│   └── package.json
└── frontend/                 React app
    ├── src/
    │   ├── components/            ProductCard, CategorySelect, LoadMoreButton, etc.
    │   ├── hooks/useProductFeed.js  Pagination state machine
    │   ├── lib/api.js              Fetch wrapper for the backend
    │   └── App.jsx
    ├── .env.example
    └── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, Docker, or MongoDB Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env if your MongoDB URI/port differ from the defaults
npm install
npm run seed     # generates 200,000 products (takes ~1-2 min depending on hardware)
npm run dev      # starts the API on http://localhost:4000
```

`.env` variables:

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | Mongo connection string | `mongodb://localhost:27017/product_browser` |
| `PORT` | API server port | `4000` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `SEED_COUNT` | How many products the seed script generates | `200000` |
| `SEED_BATCH_SIZE` | Bulk insert batch size | `5000` |

Don't have MongoDB running locally? The quickest option is Docker:

```bash
docker run -d --name product-browser-mongo -p 27017:27017 mongo:7
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# edit .env if your backend isn't on http://localhost:4000
npm install
npm run dev      # starts the app on http://localhost:5173
```

Open `http://localhost:5173`. The category dropdown, "Load more" button, and "Insert 50 products" button are all live against your local API.

### 3. (Optional) Insert more products from the CLI

```bash
cd backend
node src/scripts/insertMore.js 50   # inserts 50 more, defaults to 50 if no arg given
```

This is the same logic exposed by the in-app "Insert 50 products" button, just runnable without the UI.

## API

### `GET /api/products`

| Query param | Type | Description |
|---|---|---|
| `category` | string | One of `Electronics`, `Fashion`, `Books`, `Sports`, `Home`, `Toys`. Omit for all categories. |
| `cursor` | string | Opaque cursor from a previous response's `nextCursor`. Omit for the first page. |
| `limit` | number | Page size, default 24, max 100. |

Response shape:

```json
{
  "products": [ { "_id": "...", "name": "...", "category": "...", "price": 42.5, "createdAt": "...", "updatedAt": "..." } ],
  "nextCursor": "eyJ1IjoiMjAyNi0wNi0yMlQxMjowMDowMC4wMDBaIiwiaSI6IjY2NWY...",
  "hasMore": true,
  "count": 24
}
```

Examples:

```
GET /api/products
GET /api/products?category=Electronics
GET /api/products?cursor=eyJ1IjoiMjAyNi0wNi0yMlQxMjowMDowMC4wMDBaIiwiaSI6IjY2NWY...
GET /api/products?category=Books&cursor=...&limit=50
```

### `GET /api/products/categories`
Returns the list of valid category values, so the frontend doesn't hardcode them.

### `POST /api/products/seed-batch`
Body: `{ "count": 50 }` (optional, defaults to 50, capped at 1000). Inserts that many freshly-timestamped random products. Used by the "Insert 50 products" demo button.

## Why cursor pagination instead of skip/limit?

The brief calls for browsing 200,000+ products, sorted newest-first, while the underlying data keeps changing (new products get inserted while someone is mid-scroll). Those two constraints — scale and concurrent writes — are exactly what `skip`/`limit` handles badly and cursor pagination handles well.

**`skip`/`limit` degrades as you page deeper.** `Product.find().sort(...).skip(10000).limit(24)` makes MongoDB walk and discard the first 10,000 matching documents on every single request before it can return page 417. The further into the catalog a user scrolls, the slower every subsequent page gets — an O(n) cost per page, O(n²) total, over a full scroll. With 200,000 products that's a real, measurable slowdown by the time someone's a few hundred pages in.

**`skip`/`limit` is unstable under concurrent inserts.** `skip` is a positional offset into whatever the current sort order happens to be. If a new product is inserted with a newer `updatedAt` while a user is on page 3, every document shifts down by one position. The next `skip(72)` now lands one document earlier than before — that user either sees the last item of the previous page again (a duplicate) or skips over an item entirely (a miss), depending on which way the shift goes. This is the classic "page drift" bug, and it gets worse the more inserts happen while someone is browsing.

**Cursor pagination fixes both problems by encoding a position instead of an offset.** Instead of asking "skip N, give me the next 24," the client says "give me the next 24 documents that come *after* this exact `(updatedAt, _id)` position." That's:

- **Fast at any depth.** `(updatedAt, _id)` is a compound index (`{ updatedAt: -1, _id: -1 }`, and `{ category: 1, updatedAt: -1, _id: -1 }` for filtered queries), so the query is a direct index seek to that position followed by reading forward — O(page size), not O(offset). Page 2 and page 4,000 cost the same.
- **Stable under concurrent writes.** A cursor pins to a specific document's position, not a row count. If new products are inserted with newer timestamps while a user is mid-scroll, they sort *before* the cursor position, not after it — they don't affect documents the user has already paged past, and they don't get skipped or duplicated. They simply appear at the top the next time the feed is loaded fresh. The "Insert 50 products" button in this app exists specifically to demonstrate this: insert new products, and the pages you've already loaded stay exactly as they were.

**Why `(updatedAt, _id)` together, and not `updatedAt` alone?** `updatedAt` by itself isn't guaranteed unique — at this scale it's entirely plausible for two products to share the same millisecond timestamp (the seed script doesn't try to avoid this). If the cursor only tracked `updatedAt`, a tie would mean the next page's query (`updatedAt < cursor.updatedAt`) could skip every other document that shared that exact timestamp. Adding `_id` (itself unique and naturally ordered by insertion time) as a tiebreaker gives every document an unambiguous position in the sort order: `updatedAt DESC, _id DESC`. The cursor condition becomes `updatedAt < cursor.updatedAt OR (updatedAt == cursor.updatedAt AND _id < cursor._id)` — a strict, gapless "give me everything after this point" query with no possibility of duplicates or omissions, tie or no tie.

The tradeoff: cursor pagination can't jump to an arbitrary page number ("go to page 50") the way `skip`/`limit` can, since a cursor only knows how to move forward from a position, not compute an arbitrary offset. That's an acceptable, common tradeoff for an infinite-scroll / "load more" style feed like this one, where users page forward sequentially rather than jumping to page N.

## Notes on the indexes

```js
productSchema.index({ updatedAt: -1, _id: -1 });
productSchema.index({ category: 1, updatedAt: -1, _id: -1 });
```

- The first index serves the unfiltered "all categories" feed.
- The second serves category-filtered queries: MongoDB can use the `category` prefix to narrow to one category, then walk `updatedAt`/`_id` in already-sorted order within that category — no in-memory sort required either way.

Both indexes are declared directly on the Mongoose schema and created automatically the first time the app connects (Mongoose calls `createIndexes()` on model compilation). The seed script also explicitly calls `syncIndexes()` after the bulk insert to guarantee they exist before you start querying.
