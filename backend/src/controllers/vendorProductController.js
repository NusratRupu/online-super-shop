const db = require("../config/db");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureApprovedVendor(userId) {
  const [rows] = await db.query(
    "SELECT approval_status FROM vendor_profiles WHERE user_id = ? LIMIT 1",
    [userId]
  );

  if (rows.length === 0) throw new Error("Vendor profile not found.");
  if (rows[0].approval_status !== "approved") {
    throw new Error("Vendor account is not approved yet.");
  }
}

async function getMyProducts(req, res) {
  try {
    await ensureApprovedVendor(req.user.id);

    const [products] = await db.query(
      `
      SELECT p.*, c.name AS category_name, vp.shop_name AS vendor_shop_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.seller_id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function createMyProduct(req, res) {
  try {
    await ensureApprovedVendor(req.user.id);

    const {
      name,
      category_id,
      product_type,
      product_condition,
      price,
      old_price,
      stock,
      unit,
      image_url,
      description,
    } = req.body;

    if (!name || !category_id || !price) {
      return res.status(400).json({
        success: false,
        message: "Product name, category, and price are required.",
      });
    }

    const finalType = product_type === "resale" ? "resale" : "super_shop";
    const finalCondition = finalType === "resale" ? product_condition || "used_good" : "new";

    if (finalType === "resale" && !old_price) {
      return res.status(400).json({
        success: false,
        message: "Old/original price is required for resale or used products.",
      });
    }

    const slug = `${slugify(name)}-${Date.now()}`;

    await db.query(
      `
      INSERT INTO products
      (
        seller_id, category_id, name, slug, description,
        product_type, product_condition, price, old_price,
        stock, unit, image_url, approval_status, is_featured, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0)
      `,
      [
        req.user.id,
        category_id,
        name,
        slug,
        description || "",
        finalType,
        finalCondition,
        Number(price),
        old_price ? Number(old_price) : null,
        Number(stock || 0),
        unit || "pcs",
        image_url || "",
      ]
    );

    res.json({
      success: true,
      message: "Product submitted successfully. Waiting for admin approval.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateMyProduct(req, res) {
  try {
    await ensureApprovedVendor(req.user.id);

    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT id FROM products WHERE id = ? AND seller_id = ?",
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor.",
      });
    }

    const {
      name,
      category_id,
      product_type,
      product_condition,
      price,
      old_price,
      stock,
      unit,
      image_url,
      description,
    } = req.body;

    const finalType = product_type === "resale" ? "resale" : "super_shop";
    const finalCondition = finalType === "resale" ? product_condition || "used_good" : "new";

    if (finalType === "resale" && !old_price) {
      return res.status(400).json({
        success: false,
        message: "Old/original price is required for resale or used products.",
      });
    }

    await db.query(
      `
      UPDATE products
      SET name = ?, category_id = ?, product_type = ?, product_condition = ?,
          price = ?, old_price = ?, stock = ?, unit = ?, image_url = ?,
          description = ?, approval_status = 'pending', is_active = 0
      WHERE id = ? AND seller_id = ?
      `,
      [
        name,
        category_id,
        finalType,
        finalCondition,
        Number(price),
        old_price ? Number(old_price) : null,
        Number(stock || 0),
        unit || "pcs",
        image_url || "",
        description || "",
        id,
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: "Product updated and sent for admin review.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function setMyProductOutOfStock(req, res) {
  try {
    await ensureApprovedVendor(req.user.id);

    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE products SET stock = 0 WHERE id = ? AND seller_id = ?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor.",
      });
    }

    res.json({ success: true, message: "Product marked as out of stock." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function deleteMyProduct(req, res) {
  try {
    await ensureApprovedVendor(req.user.id);

    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM products WHERE id = ? AND seller_id = ?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not owned by this vendor.",
      });
    }

    res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getMyProducts,
  createMyProduct,
  updateMyProduct,
  setMyProductOutOfStock,
  deleteMyProduct,
};
