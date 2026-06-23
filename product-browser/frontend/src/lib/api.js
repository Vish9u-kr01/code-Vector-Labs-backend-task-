const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

/**
 * Fetch one page of products.
 * @param {{ category?: string, cursor?: string, limit?: number }} params
 */
export function fetchProducts({ category, cursor, limit } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));

  const qs = params.toString();
  return request(`/api/products${qs ? `?${qs}` : ""}`);
}

export function fetchCategories() {
  return request("/api/products/categories");
}

export function insertRandomProducts(count = 50) {
  return request("/api/products/seed-batch", {
    method: "POST",
    body: JSON.stringify({ count }),
  });
}
