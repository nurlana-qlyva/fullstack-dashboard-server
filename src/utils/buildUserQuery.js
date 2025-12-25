function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function buildUserQuery(query) {
  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(query.limit, 10)));
  const skip = (page - 1) * limit;

  const sortBy = ["createdAt", "name", "email", "role"].includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const filter = {};
  if (query.role) filter.role = query.role;

  const q = query.q ? String(query.q).trim() : "";
  if (q) filter.$text = { $search: q };

  return { page, limit, skip, sort, filter, q };
}

module.exports = { buildUserQuery };
