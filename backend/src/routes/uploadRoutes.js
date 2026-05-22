const express = require("express");
const {
  upload,
  uploadProductImage,
} = require("../controllers/uploadController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/product-image",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  uploadProductImage
);

module.exports = router;
