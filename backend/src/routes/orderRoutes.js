const express = require("express");
const {
  placeOrder,
  trackOrder,
  getMyOrders,
} = require("../controllers/orderController");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", optionalAuth, placeOrder);
router.get("/track", trackOrder);
router.get("/my", requireAuth, requireRole("customer"), getMyOrders);

module.exports = router;
