const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();
const COMMISSION_RATE = 10;

router.use(requireAuth, requireRole("admin"));

router.get("/orders", async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT
        o.*,
        du.name AS deliveryman_name,
        du.phone AS deliveryman_phone,
        dp.area AS deliveryman_area,
        dp.vehicle_type,
        dp.points AS deliveryman_total_points
      FROM orders o
      LEFT JOIN users du ON du.id = o.deliveryman_id
      LEFT JOIN deliveryman_profiles dp ON dp.user_id = o.deliveryman_id
      WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
         OR o.deliveryman_id IS NOT NULL
      ORDER BY o.created_at DESC
    `);

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load delivery management orders.",
      error: error.message,
    });
  }
});

async function settleSellerEarnings(orderId) {
  const [items] = await db.query(
    `
    SELECT
      oi.id AS order_item_id,
      oi.product_id,
      oi.quantity,
      oi.price,
      p.name AS product_name,
      p.seller_id,
      p.product_type
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
      AND p.seller_id IS NOT NULL
      AND p.product_type IN ('resale', 'vendor', 'super_shop')
    `,
    [orderId]
  );

  for (const item of items) {
    const [existing] = await db.query(
      "SELECT id FROM seller_earnings WHERE order_id = ? AND order_item_id = ? LIMIT 1",
      [orderId, item.order_item_id]
    );

    if (existing.length > 0) continue;

    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const gross = quantity * price;
    const commission = Math.round((gross * COMMISSION_RATE) / 100);
    const net = gross - commission;
    const points = Math.round(net);

    await db.query(
      `
      INSERT INTO seller_earnings
      (
        order_id, order_item_id, product_id, seller_id, product_name,
        quantity, gross_amount, commission_rate, commission_amount,
        seller_net_amount, points_awarded, settlement_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
      `,
      [
        orderId,
        item.order_item_id,
        item.product_id,
        item.seller_id,
        item.product_name,
        quantity,
        gross,
        COMMISSION_RATE,
        commission,
        net,
        points,
      ]
    );

    await db.query(
      `
      INSERT INTO seller_wallets
      (seller_id, points, total_sales_amount, total_commission_amount, total_net_amount)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        points = points + VALUES(points),
        total_sales_amount = total_sales_amount + VALUES(total_sales_amount),
        total_commission_amount = total_commission_amount + VALUES(total_commission_amount),
        total_net_amount = total_net_amount + VALUES(total_net_amount)
      `,
      [item.seller_id, points, gross, commission, net]
    );
  }
}

router.patch("/orders/:id/approve-payout", async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      "SELECT id, deliveryman_id, customer_received, delivery_status, delivery_points, delivery_payout_status FROM orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = orders[0];

    if (!order.deliveryman_id) {
      return res.status(400).json({ success: false, message: "No deliveryman assigned to this order." });
    }

    if (!order.customer_received || order.delivery_status !== "delivered_by_deliveryman") {
      return res.status(400).json({
        success: false,
        message: "Customer must confirm received before payout approval.",
      });
    }

    if (order.delivery_payout_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Payout and settlement already approved for this order.",
      });
    }

    const deliveryPoints = Number(order.delivery_points || 10);

    await db.query(
      "UPDATE orders SET delivery_payout_status = 'approved', delivery_points = ? WHERE id = ?",
      [deliveryPoints, id]
    );

    await db.query(
      "UPDATE deliveryman_profiles SET points = points + ? WHERE user_id = ?",
      [deliveryPoints, order.deliveryman_id]
    );

    await settleSellerEarnings(id);

    res.json({
      success: true,
      message: "Delivery payout and seller settlement approved.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve payout and settlement.",
      error: error.message,
    });
  }
});

router.get("/deliverymen", async (req, res) => {
  try {
    const [deliverymen] = await db.query(`
      SELECT
        u.id, u.name, u.email, u.phone, u.status,
        dp.area, dp.vehicle_type, dp.approval_status, dp.points
      FROM users u
      LEFT JOIN deliveryman_profiles dp ON dp.user_id = u.id
      WHERE u.role = 'deliveryman'
      ORDER BY u.id DESC
    `);

    res.json({ success: true, deliverymen });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load deliverymen.", error: error.message });
  }
});

router.patch("/deliverymen/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("UPDATE users SET status = 'active' WHERE id = ? AND role = 'deliveryman'", [id]);

    await db.query(
      `INSERT INTO deliveryman_profiles (user_id, approval_status, points)
       VALUES (?, 'approved', 0)
       ON DUPLICATE KEY UPDATE approval_status = 'approved'`,
      [id]
    );

    res.json({ success: true, message: "Deliveryman approved." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve deliveryman.", error: error.message });
  }
});

router.patch("/deliverymen/:id/block", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("UPDATE users SET status = 'blocked' WHERE id = ? AND role = 'deliveryman'", [id]);
    await db.query("UPDATE deliveryman_profiles SET approval_status = 'blocked' WHERE user_id = ?", [id]);

    res.json({ success: true, message: "Deliveryman blocked." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to block deliveryman.", error: error.message });
  }
});

module.exports = router;

