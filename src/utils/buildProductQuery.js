function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function buildProductQuery(query) {
  // Pagination
  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(query.limit, 10)));
  const skip = (page - 1) * limit;

  // Sort (default: newest)
  // allowlist: createdAt, price, stock, title, soldCount
  const sortBy = ["createdAt", "price", "stock", "title", "soldCount"].includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  // Filters
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  // price range
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = toInt(query.minPrice, 0);
    if (query.maxPrice) filter.price.$lte = toInt(query.maxPrice, 999999999);
  }

  // stock range
  if (query.minStock || query.maxStock) {
    filter.stock = {};
    if (query.minStock) filter.stock.$gte = toInt(query.minStock, 0);
    if (query.maxStock) filter.stock.$lte = toInt(query.maxStock, 999999999);
  }

  // tags (any match)
  if (query.tags) {
    // tags=summer,blue
    const tags = String(query.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length) filter.tags = { $in: tags };
  }

  // Search
  const q = query.q ? String(query.q).trim() : "";
  if (q) {
    // text search
    filter.$text = { $search: q };
  }

  return { page, limit, skip, sort, filter, q };
}

module.exports = { buildProductQuery };
