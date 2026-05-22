const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = "customer",
      shop_name,
      shop_phone,
      shop_address,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!["customer", "vendor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Only customer and vendor registration is allowed",
      });
    }

    if (role === "vendor" && !shop_name) {
      return res.status(400).json({
        success: false,
        message: "Shop name is required for vendor registration",
      });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const status = role === "vendor" ? "pending" : "active";

    const [result] = await db.query(
      "INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, phone || null, passwordHash, role, status]
    );

    const userId = result.insertId;

    if (role === "vendor") {
      await db.query(
        "INSERT INTO vendor_profiles (user_id, shop_name, shop_phone, shop_address, approval_status) VALUES (?, ?, ?, ?, 'pending')",
        [userId, shop_name, shop_phone || phone || null, shop_address || null]
      );
    }

    res.status(201).json({
      success: true,
      message: role === "vendor"
        ? "Vendor registration submitted for admin approval"
        : "Customer registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const [users] = await db.query(
      "SELECT id, name, email, phone, password_hash, role, status FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
}

async function me(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  me,
};
