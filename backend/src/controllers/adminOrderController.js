const db = require("../config/db");

const allowedStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
];

async function getAdminOrders(req, res) {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.*,
        COUNT(oi.id) AS item_count,
        GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS product_names
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

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

async function getAdminOrderById(req, res) {
  try {
    const { id } = req.params;

    const [orders] = await db.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [id]
    );

    res.json({
      success: true,
      order: {
        ...orders[0],
        items,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load order details",
      error: error.message,
    });
  }
}

async function updateOrderStatus(req, res) {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query(
      "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentStatus = orders[0].status;
    const finalStatuses = ["cancelled", "rejected"];

    if (finalStatuses.includes(currentStatus) && !finalStatuses.includes(status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Cancelled or rejected orders cannot be reactivated",
      });
    }

    if (finalStatuses.includes(status) && !finalStatuses.includes(currentStatus)) {
      const [items] = await connection.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL",
        [id]
      );

      for (const item of items) {
        await connection.query(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Order status updated successfully",
      status,
    });
  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
};
