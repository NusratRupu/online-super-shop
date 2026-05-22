const express = require("express");
const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
} = require("../controllers/adminProductController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getAdminProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id/disable", deleteProduct);
router.delete("/:id", hardDeleteProduct);

module.exports = router;
