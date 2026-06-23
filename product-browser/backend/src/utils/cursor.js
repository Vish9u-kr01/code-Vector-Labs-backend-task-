/**
 * Cursor pagination helpers.
 *
 * The cursor encodes the last document a client has seen: its sort key
 * (updatedAt) and its _id (the tiebreaker). We base64url-encode a small
 * JSON payload so the cursor is a single opaque, URL-safe string from the
 * client's point of view, even though it's just {u, i} under the hood.
 *
 * Why updatedAt + _id together?
 * - updatedAt alone is not unique: many products can share the same
 *   millisecond (likely with 200k seeded rows), so paging on updatedAt
 *   alone would either skip or repeat documents whenever there's a tie.
 * - _id is unique and, for ObjectIds, is itself monotonically increasing
 *   at insert time, so it makes a perfect, always-unique tiebreaker.
 * - Together (updatedAt DESC, _id DESC) define a strict total order over
 *   the collection. Every document has an unambiguous position in that
 *   order, so "give me everything after this cursor" is well-defined
 *   even while new documents are being inserted concurrently.
 */

export function encodeCursor(doc) {
  if (!doc) return null;
  const payload = JSON.stringify({
    u: new Date(doc.updatedAt).toISOString(),
    i: String(doc._id),
  });
  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const { u, i } = JSON.parse(json);
    if (!u || !i) return null;
    return { updatedAt: new Date(u), id: i };
  } catch {
    // Malformed/tampered cursor -> treat as "no cursor" rather than crash.
    return null;
  }
}
