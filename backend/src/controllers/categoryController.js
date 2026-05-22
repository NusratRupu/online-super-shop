const db = require("../config/db");

async function getCategories(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id, name, slug, image_url, is_active FROM categories WHERE is_active = TRUE ORDER BY name ASC"
    );

    res.json({
      success: true,
      categories: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load categories",
      error: error.message,
    });
  }
}

module.exports = {
  getCategories,
};
