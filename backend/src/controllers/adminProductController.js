const db = require("../config/db");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getAdminProducts(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        c.name AS category_name,
        u.name AS seller_name,
        vp.shop_name AS vendor_shop_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.seller_id
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, products: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin products",
      error: error.message,
    });
  }
}

async function createProduct(req, res) {
  try {
    const {
      seller_id,
      category_id,
      name,
      description,
      product_type = "super_shop",
      product_condition = "new",
      price,
      old_price,
      stock = 0,
      unit = "pcs",
      image_url,
      approval_status = "approved",
      is_featured = false,
      is_active = true,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required",
      });
    }

    const baseSlug = slugify(name);
    const slug = `${baseSlug}-${Date.now()}`;

    const [result] = await db.query(
      `
      INSERT INTO products
      (seller_id, category_id, name, slug, description, product_type, product_condition, price, old_price, stock, unit, image_url, approval_status, is_featured, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        seller_id || null,
        category_id || null,
        name,
        slug,
        description || null,
        product_type,
        product_condition,
        Number(price),
        old_price ? Number(old_price) : null,
        Number(stock),
        unit,
        image_url || null,
        approval_status,
        Boolean(is_featured),
        Boolean(is_active),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product_id: result.insertId,
      slug,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      seller_id,
      category_id,
      name,
      description,
      product_type,
      product_condition,
      price,
      old_price,
      stock,
      unit,
      image_url,
      approval_status,
      is_featured,
      is_active,
    } = req.body;

    const [existing] = await db.query("SELECT id FROM products WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await db.query(
      `
      UPDATE products
      SET
        seller_id = ?,
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
        approval_status = ?,
        is_featured = ?,
        is_active = ?
      WHERE id = ?
      `,
      [
        seller_id || null,
        category_id || null,
        name,
        description || null,
        product_type,
        product_condition,
        Number(price),
        old_price ? Number(old_price) : null,
        Number(stock),
        unit,
        image_url || null,
        approval_status,
        Boolean(is_featured),
        Boolean(is_active),
        id,
      ]
    );

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE products SET is_active = FALSE WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product disabled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
}

async function hardDeleteProduct(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product permanently deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete product",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
};

