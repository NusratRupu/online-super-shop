const db = require("../config/db");

async function requireApprovedVendor(req, res, next) {
  try {
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Vendor access required",
      });
    }

    const [rows] = await db.query(
      `
      SELECT 
        u.id, u.status, vp.approval_status
      FROM users u
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found",
      });
    }

    const vendor = rows[0];

    if (vendor.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Vendor account is not active",
      });
    }

    if (vendor.approval_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Vendor account is waiting for admin approval",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify vendor account",
      error: error.message,
    });
  }
}

module.exports = {
  requireApprovedVendor,
};
