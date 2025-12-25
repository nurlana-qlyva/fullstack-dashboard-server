const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const { getOverviewAnalytics } = require("../controllers/analytics.overview.controller");

router.get("/overview", requireAuth, requireRole("admin", "manager"), getOverviewAnalytics);

module.exports = router;
