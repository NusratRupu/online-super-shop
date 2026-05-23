const db = require("../config/db");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureResaleCategory() {
  const [existing] = await db.query(
    "SELECT id FROM categories WHERE name = 'Resale Items' OR slug = 'resale-items' LIMIT 1"
  );

  if (existing.length > 0) return existing[0].id;

  const [result] = await db.query(
    "INSERT INTO categories (name, slug, image_url, is_active) VALUES ('Resale Items', 'resale-items', '', 1)"
  );

  return result.insertId;
}

async function getMyResaleProducts(req, res) {
  try {
    const [products] = await db.query(
      `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.seller_id = ?
        AND p.product_type = 'resale'
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load resale products.", error: error.message });
  }
}

async function createMyResaleProduct(req, res) {
  try {
    const { name, product_condition, price, old_price, stock, unit, image_url, description } = req.body;

    if (!name || !price || !old_price) {
      return res.status(400).json({
        success: false,
        message: "Product name, selling price, and old/original price are required.",
      });
    }

    const categoryId = await ensureResaleCategory();
    const slug = `${slugify(name)}-${Date.now()}`;

    await db.query(
      `
      INSERT INTO products
      (
        seller_id, category_id, name, slug, description,
        product_type, product_condition, price, old_price,
        stock, unit, image_url, approval_status, is_featured, is_active
      )
      VALUES (?, ?, ?, ?, ?, 'resale', ?, ?, ?, ?, ?, ?, 'pending', 0, 0)
      `,
      [
        req.user.id,
        categoryId,
        name,
        slug,
        description || "",
        product_condition || "used_good",
        Number(price),
        Number(old_price),
        Number(stock || 1),
        unit || "pcs",
        image_url || "",
      ]
    );

    res.json({ success: true, message: "Resale product submitted. Waiting for admin approval." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit resale product.", error: error.message });
  }
}

async function updateMyResaleProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, product_condition, price, old_price, stock, unit, image_url, description } = req.body;

    const [existing] = await db.query(
      "SELECT id FROM products WHERE id = ? AND seller_id = ? AND product_type = 'resale'",
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Resale product not found." });
    }

    if (!name || !price || !old_price) {
      return res.status(400).json({
        success: false,
        message: "Product name, selling price, and old/original price are required.",
      });
    }

    const categoryId = await ensureResaleCategory();

    await db.query(
      `
      UPDATE products
      SET category_id = ?, name = ?, description = ?, product_condition = ?,
          price = ?, old_price = ?, stock = ?, unit = ?, image_url = ?,
          approval_status = 'pending', is_active = 0
      WHERE id = ? AND seller_id = ? AND product_type = 'resale'
      `,
      [
        categoryId,
        name,
        description || "",
        product_condition || "used_good",
        Number(price),
        Number(old_price),
        Number(stock || 0),
        unit || "pcs",
        image_url || "",
        id,
        req.user.id,
      ]
    );

    res.json({ success: true, message: "Resale product updated. Waiting for admin re-approval." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update resale product.", error: error.message });
  }
}

async function setMyResaleOutOfStock(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE products SET stock = 0 WHERE id = ? AND seller_id = ? AND product_type = 'resale'",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Resale product not found." });
    }

    res.json({ success: true, message: "Resale product marked out of stock." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update stock.", error: error.message });
  }
}

async function deleteMyResaleProduct(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM products WHERE id = ? AND seller_id = ? AND product_type = 'resale'",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Resale product not found." });
    }

    res.json({ success: true, message: "Resale product deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete resale product.", error: error.message });
  }
}

module.exports = {
  getMyResaleProducts,
  createMyResaleProduct,
  updateMyResaleProduct,
  setMyResaleOutOfStock,
  deleteMyResaleProduct,
};
