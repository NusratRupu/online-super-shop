const express = require("express");
const {
  getMyResaleProducts,
  createMyResaleProduct,
  updateMyResaleProduct,
  setMyResaleOutOfStock,
  deleteMyResaleProduct,
} = require("../controllers/customerResaleController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("customer"));

router.get("/resale-products", getMyResaleProducts);
router.post("/resale-products", createMyResaleProduct);
router.put("/resale-products/:id", updateMyResaleProduct);
router.patch("/resale-products/:id/out-of-stock", setMyResaleOutOfStock);
router.delete("/resale-products/:id", deleteMyResaleProduct);

module.exports = router;
