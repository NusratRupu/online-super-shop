const express = require("express");
const {
  getDeliveryOrders,
  acceptOrder,
  updateDeliveryStatus,
  getDeliverymanEarnings,
} = require("../controllers/deliverymanController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("deliveryman"));

router.get("/orders", getDeliveryOrders);
router.get("/earnings", getDeliverymanEarnings);
router.patch("/orders/:id/accept", acceptOrder);
router.patch("/orders/:id/status", updateDeliveryStatus);

module.exports = router;

