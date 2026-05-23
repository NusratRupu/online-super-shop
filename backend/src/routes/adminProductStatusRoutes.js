const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.patch("/:id/enable", async (req, res) => {
  try {
    const { id } = req.params;

    const [productRows] = await db.query(
      "SELECT approval_status FROM products WHERE id = ? LIMIT 1",
      [id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (productRows[0].approval_status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved products can be enabled.",
      });
    }

    await db.query("UPDATE products SET is_active = 1 WHERE id = ?", [id]);

    res.json({ success: true, message: "Product enabled successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to enable product.", error: error.message });
  }
});

module.exports = router;
