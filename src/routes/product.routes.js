const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} = require("../validators/product.validators");

const {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  listProducts,
} = require("../controllers/product.controller");

// List (auth yeter)
router.get("/", requireAuth, listProducts);

// Read by id
router.get("/:id", requireAuth, validate(productIdSchema), getProductById);

// Create
router.post("/", requireAuth, validate(createProductSchema), createProduct);

// Update
router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  validate(createProductSchema),
  createProduct
);

// Delete
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  validate(productIdSchema),
  deleteProduct
);

module.exports = router;
