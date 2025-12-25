const router = require("express").Router();
const { validate } = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
} = require("../validators/auth.validators");
const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/auth.controller");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
