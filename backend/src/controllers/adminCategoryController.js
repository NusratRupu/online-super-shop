const db = require("../config/db");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getAdminCategories(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({ success: true, categories: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load categories", error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, image_url, is_active = true } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const slug = `${slugify(name)}-${Date.now()}`;

    const [result] = await db.query(
      "INSERT INTO categories (name, slug, image_url, is_active) VALUES (?, ?, ?, ?)",
      [name, slug, image_url || null, Boolean(is_active)]
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category_id: result.insertId,
      slug,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create category", error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, image_url, is_active = true } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const [result] = await db.query(
      "UPDATE categories SET name = ?, image_url = ?, is_active = ? WHERE id = ?",
      [name, image_url || null, Boolean(is_active), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update category", error: error.message });
  }
}

async function disableCategory(req, res) {
  try {
    const { id } = req.params;
    await db.query("UPDATE categories SET is_active = FALSE WHERE id = ?", [id]);
    res.json({ success: true, message: "Category disabled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to disable category", error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    await db.query("UPDATE products SET category_id = NULL WHERE category_id = ?", [id]);
    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete category", error: error.message });
  }
}

module.exports = {
  getAdminCategories,
  createCategory,
  updateCategory,
  disableCategory,
  deleteCategory,
};
