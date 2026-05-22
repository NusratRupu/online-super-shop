const express = require("express");
const {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
} = require("../controllers/adminOrderController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getAdminOrders);
router.get("/:id", getAdminOrderById);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
