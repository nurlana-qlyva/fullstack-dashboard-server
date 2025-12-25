const bcrypt = require("bcrypt");
const User = require("../models/User");
const { AppError } = require("../utils/AppError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} = require("../utils/tokens");

// ✅ Cookie konfigürasyonu - tek bir yerde tanımla
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "none", // Cross-domain için zorunlu
  secure: true,     // SameSite=none için HTTPS zorunlu
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
  path: "/",        // ✅ TÜM endpoint'lerde okunabilir olmalı
};

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

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // ✅ Cookie'yi ayarla
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

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
    
    // ✅ Debug için log ekle (geliştirme aşamasında)
    console.log("🍪 Cookies received:", Object.keys(req.cookies));
    console.log("🔑 RefreshToken exists:", !!token);
    
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
    
    // Token varsa kullanıcının DB'deki hash'ini temizle
    if (token) {
      try {
        const payload = verifyRefresh(token);
        const user = await User.findById(payload.sub);
        if (user) {
          user.refreshTokenHash = null;
          await user.save();
        }
      } catch (err) {
        // Token geçersizse bile cookie'yi temizle
      }
    }

    // ✅ Cookie'yi temizle - aynı options ile
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { register, login, refresh, logout };