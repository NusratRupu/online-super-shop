const express = require("express");
const {
  placeOrder,
  trackOrder,
  getMyOrders,
} = require("../controllers/orderController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, requireRole("customer"), placeOrder);
router.get("/track", trackOrder);
router.get("/my", requireAuth, requireRole("customer"), getMyOrders);

module.exports = router;
