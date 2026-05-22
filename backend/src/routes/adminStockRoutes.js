const express = require("express");
const {
  getStockProducts,
  updateStock,
  setOutOfStock,
} = require("../controllers/adminStockController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getStockProducts);
router.patch("/:id", updateStock);
router.patch("/:id/out-of-stock", setOutOfStock);

module.exports = router;
