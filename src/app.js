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

// Body + cookie
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// CORS
const allowed = [
  "http://localhost:5173",
  "https://fullstack-dashboard-gamma.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      return allowed.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/analytics", require("./routes/analytics.overview.routes"));

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
