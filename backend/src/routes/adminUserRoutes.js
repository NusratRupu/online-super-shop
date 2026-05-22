const express = require("express");
const {
  getAdminUsers,
  updateUserStatus,
} = require("../controllers/adminUserController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getAdminUsers);
router.patch("/:id/status", updateUserStatus);

module.exports = router;
