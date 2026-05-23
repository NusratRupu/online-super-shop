const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const db = require("../config/db");

const router = express.Router();

router.get("/admin", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [records] = await db.query(`
      SELECT
        se.*,
        o.order_number,
        o.created_at AS order_date,
        u.name AS seller_name,
        u.email AS seller_email,
        u.role AS seller_role
      FROM seller_earnings se
      JOIN orders o ON o.id = se.order_id
      JOIN users u ON u.id = se.seller_id
      ORDER BY se.created_at DESC
    `);

    const [summaryRows] = await db.query(`
      SELECT
        COUNT(*) AS total_records,
        COALESCE(SUM(gross_amount), 0) AS total_sales,
        COALESCE(SUM(commission_amount), 0) AS platform_commission,
        COALESCE(SUM(seller_net_amount), 0) AS seller_payable,
        COALESCE(SUM(points_awarded), 0) AS seller_points
      FROM seller_earnings
    `);

    res.json({ success: true, summary: summaryRows[0], records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load admin sales records.", error: error.message });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    if (!["vendor", "customer"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only vendors and customer resellers can view earnings." });
    }

    const [walletRows] = await db.query(
      "SELECT * FROM seller_wallets WHERE seller_id = ? LIMIT 1",
      [req.user.id]
    );

    const [records] = await db.query(
      `
      SELECT
        se.*,
        o.order_number,
        o.created_at AS order_date
      FROM seller_earnings se
      JOIN orders o ON o.id = se.order_id
      WHERE se.seller_id = ?
      ORDER BY se.created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      success: true,
      wallet: walletRows[0] || {
        points: 0,
        total_sales_amount: 0,
        total_commission_amount: 0,
        total_net_amount: 0,
      },
      records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load earnings.", error: error.message });
  }
});

module.exports = router;
