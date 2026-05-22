const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./src/config/db");
const categoryRoutes = require("./src/routes/categoryRoutes");
const productRoutes = require("./src/routes/productRoutes");

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`NityoMart BD API running on http://localhost:${PORT}`);
});
