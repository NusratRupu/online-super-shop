const express = require("express");
const {
  getMyProducts,
  createMyProduct,
  updateMyProduct,
  setMyProductOutOfStock,
  deleteMyProduct,
} = require("../controllers/vendorProductController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("vendor"));

router.get("/products", getMyProducts);
router.post("/products", createMyProduct);
router.put("/products/:id", updateMyProduct);
router.patch("/products/:id/out-of-stock", setMyProductOutOfStock);
router.delete("/products/:id", deleteMyProduct);

module.exports = router;
