const db = require("../config/db");

async function getStockProducts(req, res) {
  try {
    const [products] = await db.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.product_type,
        p.stock,
        p.unit,
        p.price,
        p.is_active,
        p.approval_status,
        p.image_url,
        c.name AS category_name,
        u.name AS seller_name,
        vp.shop_name AS vendor_shop_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN users u ON u.id = p.seller_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.seller_id
      ORDER BY p.stock ASC, p.name ASC
      `
    );

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load stock products",
      error: error.message,
    });
  }
}

async function updateStock(req, res) {
  try {
    const { id } = req.params;
    const { stock, unit } = req.body;

    const finalStock = Number(stock);

    if (!Number.isFinite(finalStock) || finalStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be zero or a positive number",
      });
    }

    await db.query(
      "UPDATE products SET stock = ?, unit = COALESCE(?, unit) WHERE id = ?",
      [finalStock, unit || null, id]
    );

    res.json({
      success: true,
      message: "Stock updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
}

async function setOutOfStock(req, res) {
  try {
    const { id } = req.params;

    await db.query("UPDATE products SET stock = 0 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Product marked as out of stock.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark out of stock",
      error: error.message,
    });
  }
}

module.exports = {
  getStockProducts,
  updateStock,
  setOutOfStock,
};
