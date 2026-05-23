const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();

router.use(requireAuth, requireRole("customer"));

router.patch("/orders/:id/confirm-received", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      UPDATE orders
      SET customer_received = 1,
          status = 'delivered',
          payment_status = CASE
            WHEN payment_method IN ('cod', 'cash_on_delivery', 'Cash on Delivery') THEN 'verified'
            ELSE payment_status
          END,
          delivery_payout_status = 'pending',
          delivery_points = CASE WHEN delivery_points = 0 THEN 10 ELSE delivery_points END
      WHERE id = ?
        AND customer_id = ?
        AND delivery_status = 'delivered_by_deliveryman'
        AND customer_received = 0
      `,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be confirmed yet. Deliveryman must mark it delivered first.",
      });
    }

    res.json({ success: true, message: "Order received confirmation submitted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to confirm received order.", error: error.message });
  }
});

module.exports = router;
