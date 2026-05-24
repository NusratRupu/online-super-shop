const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, area, vehicle_type } = req.body;

    if (!name || !email || !phone || !password || !area || !vehicle_type) {
      return res.status(400).json({ success: false, message: "All deliveryman fields are required." });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name,email,phone,password_hash,role,status) VALUES (?,?,?,?,?,?)",
      [name, email, phone, passwordHash, "deliveryman", "inactive"]
    );

    await db.query(
      "INSERT INTO deliveryman_profiles (user_id, area, vehicle_type, approval_status, points) VALUES (?, ?, ?, 'pending', 0)",
      [result.insertId, area, vehicle_type]
    );

    res.status(201).json({
      success: true,
      message: "Deliveryman registration submitted for admin approval.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.sqlMessage || error.message || String(error),
    });
  }
});

module.exports = router;
