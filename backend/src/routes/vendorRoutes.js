const express = require("express");
const {
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
} = require("../controllers/vendorProductController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { requireApprovedVendor } = require("../middleware/vendorMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("vendor"), requireApprovedVendor);

router.get("/products", getVendorProducts);
router.post("/products", createVendorProduct);
router.put("/products/:id", updateVendorProduct);
router.delete("/products/:id", deleteVendorProduct);

module.exports = router;
