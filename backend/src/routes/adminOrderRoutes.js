const express = require("express");
const {
  getAdminOrders,
  updateOrderStatus,
  updatePaymentStatus,
} = require("../controllers/adminOrderController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getAdminOrders);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment", updatePaymentStatus);

module.exports = router;
