const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const { getOverview } = require("../controllers/overview.controller");

router.get("/", requireAuth, requireRole("admin", "manager"), getOverview);

module.exports = router;
