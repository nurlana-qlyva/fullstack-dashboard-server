const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { notFound } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const overviewRoutes = require("./routes/overview.routes");

const app = express();

// Güvenlik + log
app.use(helmet());
app.use(morgan("dev"));

// Rate limit (genel)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ✅ CORS - DÜZELTİLMİŞ VERSİYON
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://fullstack-dashboard-gamma.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Origin yoksa izin ver (Postman, mobil app vb.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS rejected origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ Cookie desteği
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // ✅ Tüm metodlar
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ İzin verilen headerlar
    exposedHeaders: ["Set-Cookie"], // ✅ Cookie'leri göster
    maxAge: 86400, // ✅ Preflight cache (24 saat)
  })
);

// ✅ Preflight istekleri için explicit handler
app.options(/.*/, cors());

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/orders", require("./routes/order.routes"));

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
