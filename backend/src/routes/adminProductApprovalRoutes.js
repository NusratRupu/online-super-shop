const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.patch("/:id/approval", async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status } = req.body;

    const allowed = ["pending", "approved", "rejected"];

    if (!allowed.includes(approval_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status",
      });
    }

    const activeStatus = approval_status === "approved" ? 1 : 0;

    const [result] = await db.query(
      "UPDATE products SET approval_status = ?, is_active = ? WHERE id = ?",
      [approval_status, activeStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message:
        approval_status === "approved"
          ? "Product approved and activated successfully."
          : `Product ${approval_status} and hidden from shop.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product approval",
      error: error.message,
    });
  }
});

module.exports = router;
