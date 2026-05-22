const express = require("express");
const {
  getAdminCategories,
  createCategory,
  updateCategory,
  disableCategory,
  deleteCategory,
} = require("../controllers/adminCategoryController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getAdminCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id/disable", disableCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
