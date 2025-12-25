const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const {
  listUsersQuerySchema,
  updateUserSchema,
  userIdSchema,
} = require("../validators/user.validators");

const { listUsers, getUserById, updateUser, deleteUser } = require("../controllers/user.controller");

// list
router.get("/", requireAuth, validate(listUsersQuerySchema), listUsers);

// read
router.get("/:id", requireAuth, validate(userIdSchema), getUserById);

// update (role/name)
router.patch("/:id", requireAuth, validate(updateUserSchema), updateUser);

// delete
router.delete("/:id", requireAuth, validate(userIdSchema), deleteUser);

module.exports = router;

//, requireRole("admin")