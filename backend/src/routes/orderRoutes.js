const express = require("express");
const {
  placeOrder,
  trackOrder,
  getMyOrders,
  cancelMyOrder,
} = require("../controllers/orderController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, requireRole("customer"), placeOrder);
router.get("/track", trackOrder);
router.get("/my", requireAuth, requireRole("customer"), getMyOrders);
router.patch("/:id/cancel", requireAuth, requireRole("customer"), cancelMyOrder);

module.exports = router;

