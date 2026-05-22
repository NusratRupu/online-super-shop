const db = require("../config/db");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function inferProductType(condition) {
  return condition === "new" ? "super_shop" : "resale";
}

async function getVendorProducts(req, res) {
  try {
    const [products] = await db.query(
      `
      SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load vendor products",
      error: error.message,
    });
  }
}

async function createVendorProduct(req, res) {
  try {
    const {
      category_id,
      name,
      description,
      product_condition = "used_good",
      price,
      old_price,
      stock = 1,
      unit = "piece",
      image_url,
    } = req.body;

    if (!category_id || !name || !price) {
      return res.status(400).json({
        success: false,
        message: "Category, product name, and price are required",
      });
    }

    const productType = inferProductType(product_condition);

    if (productType === "resale" && !old_price) {
      return res.status(400).json({
        success: false,
        message: "Old/original price is required for used or resale products",
      });
    }

    const slug = `${slugify(name)}-${Date.now()}`;

    const [result] = await db.query(
      `
      INSERT INTO products
      (
        seller_id, category_id, name, slug, description, product_type,
        product_condition, price, old_price, stock, unit, image_url,
        approval_status, is_featured, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', FALSE, TRUE)
      `,
      [
        req.user.id,
        category_id,
        name,
        slug,
        description || "",
        productType,
        product_condition,
        price,
        old_price || null,
        stock,
        unit,
        image_url || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product submitted successfully. Waiting for admin approval.",
      product_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create vendor product",
      error: error.message,
    });
  }
}

async function updateVendorProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      product_condition = "used_good",
      price,
      old_price,
      stock,
      unit,
      image_url,
      is_active = true,
    } = req.body;

    const [existing] = await db.query(
      "SELECT id FROM products WHERE id = ? AND seller_id = ? LIMIT 1",
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor",
      });
    }

    const productType = inferProductType(product_condition);

    if (productType === "resale" && !old_price) {
      return res.status(400).json({
        success: false,
        message: "Old/original price is required for used or resale products",
      });
    }

    await db.query(
      `
      UPDATE products
      SET 
        category_id = ?,
        name = ?,
        description = ?,
        product_type = ?,
        product_condition = ?,
        price = ?,
        old_price = ?,
        stock = ?,
        unit = ?,
        image_url = ?,
        is_active = ?,
        approval_status = 'pending'
      WHERE id = ? AND seller_id = ?
      `,
      [
        category_id,
        name,
        description || "",
        productType,
        product_condition,
        price,
        old_price || null,
        stock,
        unit || "piece",
        image_url || null,
        is_active ? 1 : 0,
        id,
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: "Product updated successfully. Waiting for admin re-approval.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update vendor product",
      error: error.message,
    });
  }
}

async function deleteVendorProduct(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM products WHERE id = ? AND seller_id = ?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor",
      });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete vendor product",
      error: error.message,
    });
  }
}

module.exports = {
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
};
