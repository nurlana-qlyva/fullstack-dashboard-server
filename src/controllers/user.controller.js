const User = require("../models/User");
const { AppError } = require("../utils/AppError");
const { buildUserQuery } = require("../utils/buildUserQuery");

async function listUsers(req, res, next) {
  try {
    const { page, limit, skip, sort, filter, q } = buildUserQuery(req.query);

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("_id name email role createdAt updatedAt"),
      User.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      q,
      items,
    });
  } catch (e) {
    next(e);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("_id name email role createdAt updatedAt");
    if (!user) return next(new AppError("User not found", 404));
    res.json(user);
  } catch (e) {
    next(e);
  }
}

async function updateUser(req, res, next) {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("_id name email role createdAt updatedAt");

    if (!updated) return next(new AppError("User not found", 404));
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

async function deleteUser(req, res, next) {
  try {
    // Basit güvenlik: admin kendini silemesin
    if (req.user.id === req.params.id) return next(new AppError("You cannot delete yourself", 400));

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return next(new AppError("User not found", 404));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { listUsers, getUserById, updateUser, deleteUser };
