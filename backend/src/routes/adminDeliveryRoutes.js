const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();
const COMMISSION_RATE = 10;

router.use(requireAuth, requireRole("admin"));




async function ensureSettlementTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS seller_wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL UNIQUE,
      points INT NOT NULL DEFAULT 0,
      total_sales_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS seller_earnings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      order_item_id INT NULL,
      product_id INT NOT NULL,
      seller_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      gross_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      seller_net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      points_awarded INT NOT NULL DEFAULT 0,
      settlement_status VARCHAR(40) NOT NULL DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function settleSellerEarnings(orderId) {
  await ensureSettlementTables();

  const ownerColumns = ["seller_id", "vendor_id", "customer_id", "created_by", "user_id", "owner_id"];
  const priceExpressions = ["oi.price", "oi.unit_price", "oi.product_price", "oi.selling_price", "p.price"];

  let items = [];
  let usedOwnerColumn = null;
  let usedPriceExpression = null;

  for (const ownerColumn of ownerColumns) {
    for (const priceExpression of priceExpressions) {
      try {
        const [rows] = await db.query(
          `
          SELECT
            oi.id AS order_item_id,
            oi.product_id,
            COALESCE(oi.quantity, 1) AS quantity,
            COALESCE(${priceExpression}, 0) AS item_price,
            p.name AS product_name,
            p.${ownerColumn} AS seller_id,
            u.role AS seller_role
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          LEFT JOIN users u ON u.id = p.${ownerColumn}
          WHERE oi.order_id = ?
          `,
          [orderId]
        );

        items = rows;
        usedOwnerColumn = ownerColumn;
        usedPriceExpression = priceExpression;
        break;
      } catch (error) {
        if (error.code === "ER_BAD_FIELD_ERROR") {
          continue;
        }
        throw error;
      }
    }

    if (usedOwnerColumn) break;
  }

  if (!usedOwnerColumn) {
    return {
      created: 0,
      skipped: 0,
      reason: "Could not find usable seller/price columns without metadata queries.",
    };
  }

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const sellerId = Number(item.seller_id || 0);

    if (!sellerId || !["vendor", "customer"].includes(item.seller_role)) {
      skipped += 1;
      continue;
    }

    const [existing] = await db.query(
      "SELECT id FROM seller_earnings WHERE order_id = ? AND order_item_id = ? LIMIT 1",
      [orderId, item.order_item_id]
    );

    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    const quantity = Number(item.quantity || 1);
    const gross = Number(item.item_price || 0) * quantity;
    const commission = Number(((gross * COMMISSION_RATE) / 100).toFixed(2));
    const net = Number((gross - commission).toFixed(2));
    const points = Math.round(net);

    await db.query(
      `
      INSERT INTO seller_earnings
      (order_id, order_item_id, product_id, seller_id, product_name, quantity, gross_amount, commission_rate, commission_amount, seller_net_amount, points_awarded, settlement_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
      `,
      [orderId, item.order_item_id, item.product_id, sellerId, item.product_name, quantity, gross, COMMISSION_RATE, commission, net, points]
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
      [sellerId, points, gross, commission, net]
    );

    created += 1;
  }

  return {
    created,
    skipped,
    usedOwnerColumn,
    usedPriceExpression,
  };
}

router.get("/orders", async (req, res) => {
  try {
    await ensureSettlementTables();

    const [orders] = await db.query(`
      SELECT
        o.*,
        du.name AS deliveryman_name,
        du.phone AS deliveryman_phone,
        dp.area AS deliveryman_area,
        dp.vehicle_type,
        dp.points AS deliveryman_total_points,
        (
          SELECT COUNT(*)
          FROM seller_earnings se
          WHERE se.order_id = o.id
        ) AS seller_settlement_count
      FROM orders o
      LEFT JOIN users du ON du.id = o.deliveryman_id
      LEFT JOIN deliveryman_profiles dp ON dp.user_id = o.deliveryman_id
      WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
         OR o.deliveryman_id IS NOT NULL
      ORDER BY o.created_at DESC
    `);

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load delivery orders.", error: error.sqlMessage || error.message });
  }
});

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

    const alreadyApproved = order.delivery_payout_status === "approved";
    const deliveryPoints = Number(order.delivery_points || 10);

    if (!alreadyApproved) {
      await db.query(
        "UPDATE orders SET delivery_payout_status = 'approved', delivery_points = ? WHERE id = ?",
        [deliveryPoints, id]
      );

      await db.query(
        "UPDATE deliveryman_profiles SET points = points + ? WHERE user_id = ?",
        [deliveryPoints, order.deliveryman_id]
      );
    }

    const settlement = await settleSellerEarnings(id);

    res.json({
      success: true,
      message: alreadyApproved
        ? `Seller settlement verified. Created ${settlement.created} record(s).`
        : `Delivery payout and seller settlement approved. Created ${settlement.created} seller record(s).`,
      settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve payout and settlement.",
      error: error.sqlMessage || error.message,
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
