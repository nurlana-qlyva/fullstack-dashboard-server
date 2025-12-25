const { AppError } = require("../utils/AppError");
const { verifyAccess } = require("../utils/tokens");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError("Missing token", 401));

  const token = header.slice(7);
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError("Invalid token", 401));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Unauthorized", 401));
    if (!roles.includes(req.user.role)) return next(new AppError("Forbidden", 403));
    next();
  };
}

module.exports = { requireAuth, requireRole };
