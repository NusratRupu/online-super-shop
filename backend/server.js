const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./src/config/db");
const categoryRoutes = require("./src/routes/categoryRoutes");
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const adminProductRoutes = require("./src/routes/adminProductRoutes");
const adminProductStatusRoutes = require("./src/routes/adminProductStatusRoutes");
const adminProductApprovalRoutes = require("./src/routes/adminProductApprovalRoutes");
const adminCategoryRoutes = require("./src/routes/adminCategoryRoutes");
const authRoutes = require("./src/routes/authRoutes");
const adminOrderRoutes = require("./src/routes/adminOrderRoutes");
const adminStockRoutes = require("./src/routes/adminStockRoutes");
const adminUserRoutes = require("./src/routes/adminUserRoutes");
const vendorRoutes = require("./src/routes/vendorRoutes");
const customerResaleRoutes = require("./src/routes/customerResaleRoutes");
const customerDeliveryRoutes = require("./src/routes/customerDeliveryRoutes");
const deliverymanRoutes = require("./src/routes/deliverymanRoutes");
const deliverymanAuthRoutes = require("./src/routes/deliverymanAuthRoutes");
const adminDeliveryRoutes = require("./src/routes/adminDeliveryRoutes");
const salesRecordsRoutes = require("./src/routes/salesRecordsRoutes");
const supportRoutes = require("./src/routes/supportRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "NityoMart BD API is running",
    project: "Online Super Shop & Daily Essentials",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS database_name, NOW() AS server_time");
    res.json({
      status: "ok",
      database: rows[0].database_name,
      server_time: rows[0].server_time,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/products", adminProductStatusRoutes);
app.use("/api/admin/product-approval", adminProductApprovalRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/stock", adminStockRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/customer", customerResaleRoutes);
app.use("/api/customer", customerDeliveryRoutes);
app.use("/api/deliveryman-auth", deliverymanAuthRoutes);
app.use("/api/deliveryman", deliverymanRoutes);
app.use("/api/admin/delivery", adminDeliveryRoutes);
app.use("/api/sales-records", salesRecordsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`NityoMart BD API running on http://localhost:${PORT}`);
});






















