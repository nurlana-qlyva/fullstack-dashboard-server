const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const {
  createOrder,
  listOrders,
  recentOrders,
  updateOrderStatus,
  getOrderById,
} = require("../controllers/order.controller");

// admin/manager
router.get("/", requireAuth, requireRole("admin", "manager"), listOrders);
router.post("/", requireAuth, requireRole("admin", "manager"), createOrder);
router.get(
  "/recent",
  requireAuth,
  requireRole("admin", "manager"),
  recentOrders
);
router.get("/:id", requireAuth, requireRole("admin", "manager"), getOrderById);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin", "manager"),
  updateOrderStatus
);


module.exports = router;
