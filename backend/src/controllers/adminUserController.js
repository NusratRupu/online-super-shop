const db = require("../config/db");

async function getAdminUsers(req, res) {
  try {
    const [users] = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
        vp.shop_name, vp.shop_phone, vp.shop_address, vp.approval_status
      FROM users u
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load users", error: error.message });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, approval_status } = req.body;

    const allowedUserStatuses = ["active", "pending", "inactive", "blocked"];
    const allowedApprovalStatuses = ["pending", "approved", "rejected"];

    const [targetRows] = await db.query("SELECT id, role FROM users WHERE id = ? LIMIT 1", [id]);

    if (targetRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const targetUser = targetRows[0];

    if (status && !allowedUserStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid user status" });
    }

    if (approval_status && !allowedApprovalStatuses.includes(approval_status)) {
      return res.status(400).json({ success: false, message: "Invalid approval status" });
    }

    if (targetUser.role === "admin" && status && status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be blocked or disabled from this panel",
      });
    }

    if (status) {
      await db.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    }

    if (approval_status && targetUser.role === "vendor") {
      await db.query("UPDATE vendor_profiles SET approval_status = ? WHERE user_id = ?", [approval_status, id]);
    }

    res.json({ success: true, message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
  }
}

module.exports = {
  getAdminUsers,
  updateUserStatus,
};
