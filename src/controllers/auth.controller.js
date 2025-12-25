const bcrypt = require("bcrypt");
const User = require("../models/User");
const { AppError } = require("../utils/AppError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} = require("../utils/tokens");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return next(new AppError("Email already in use", 409));

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(new AppError("Invalid credentials", 401));

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return next(new AppError("Invalid credentials", 401));

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
    });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    // Refresh token hash sakla (rotate altyapısı)
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd, // ✅ sadece prod'da true
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/refresh",
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return next(new AppError("Missing refresh token", 401));

    const payload = verifyRefresh(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash)
      return next(new AppError("Unauthorized", 401));

    const matches = await bcrypt.compare(token, user.refreshTokenHash);
    if (!matches) return next(new AppError("Unauthorized", 401));

    const newAccess = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
    });
    res.json({ accessToken: newAccess });
  } catch (e) {
    next(new AppError("Invalid refresh token", 401));
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      // best-effort invalidate
      // (tokeni decode edip user bulmak opsiyonel; basit yaklaşım cookie sil)
    }
    res.clearCookie("refreshToken");
    res.json({ ok: true });

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      path: "/api/refresh",
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, refresh, logout };
