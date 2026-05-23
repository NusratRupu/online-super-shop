const db = require("../config/db");

async function getDeliveryOrders(req, res) {
  try {
    const [orders] = await db.query(
      `
      SELECT *
      FROM orders
      WHERE status IN ('confirmed', 'processing', 'shipped')
        AND (deliveryman_id IS NULL OR deliveryman_id = ?)
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load delivery orders.", error: error.message });
  }
}

async function acceptOrder(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      UPDATE orders
      SET deliveryman_id = ?,
          delivery_status = 'accepted',
          status = 'shipped'
      WHERE id = ?
        AND (deliveryman_id IS NULL OR deliveryman_id = ?)
        AND status IN ('confirmed', 'processing', 'shipped')
      `,
      [req.user.id, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: "Order cannot be accepted." });
    }

    res.json({ success: true, message: "Order accepted for delivery." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to accept order.", error: error.message });
  }
}

async function updateDeliveryStatus(req, res) {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;

    const allowed = ["accepted", "picked_up", "on_the_way", "delivered_by_deliveryman"];
    if (!allowed.includes(delivery_status)) {
      return res.status(400).json({ success: false, message: "Invalid delivery status." });
    }

    const [result] = await db.query(
      `
      UPDATE orders
      SET delivery_status = ?,
          status = 'shipped'
      WHERE id = ?
        AND deliveryman_id = ?
        AND status IN ('confirmed', 'processing', 'shipped')
      `,
      [delivery_status, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Assigned order not found." });
    }

    res.json({ success: true, message: "Delivery status updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update delivery status.", error: error.message });
  }
}

async function getDeliverymanEarnings(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT points, area, vehicle_type, approval_status FROM deliveryman_profiles WHERE user_id = ? LIMIT 1",
      [req.user.id]
    );

    const [orders] = await db.query(
      `SELECT order_number, delivery_points, delivery_payout_status, customer_received, delivery_status, created_at
       FROM orders
       WHERE deliveryman_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      wallet: rows[0] || { points: 0 },
      records: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load deliveryman earnings.", error: error.message });
  }
}

module.exports = { getDeliveryOrders, acceptOrder, updateDeliveryStatus, getDeliverymanEarnings };

