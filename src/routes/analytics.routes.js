const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const { getProductAnalytics, advancedAnalytics } = require("../controllers/analytics.controller");

router.get("/products", requireAuth, requireRole("admin", "manager"), getProductAnalytics);
router.get("/advanced", requireAuth, requireRole("admin","manager"), advancedAnalytics);

module.exports = router;
