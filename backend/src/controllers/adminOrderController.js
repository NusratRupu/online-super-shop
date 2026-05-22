const db = require("../config/db");

async function getAdminOrders(req, res) {
  try {
    const [orders] = await db.query(
      `
      SELECT *
      FROM orders
      ORDER BY created_at DESC
      `
    );

    for (const order of orders) {
      const [items] = await db.query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id]
      );
      order.items = items;
    }

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load orders",
      error: error.message,
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "rejected",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    res.json({
      success: true,
      message: "Order status updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const allowed = ["pending", "submitted", "verified", "rejected"];

    if (!allowed.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    await db.query("UPDATE orders SET payment_status = ? WHERE id = ?", [
      payment_status,
      id,
    ]);

    res.json({
      success: true,
      message: "Payment status updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminOrders,
  updateOrderStatus,
  updatePaymentStatus,
};
