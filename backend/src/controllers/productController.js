const db = require("../config/db");

async function getProducts(req, res) {
  try {
    const { search, category, featured, type } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.product_type,
        p.product_condition,
        p.price,
        p.old_price,
        p.stock,
        p.unit,
        p.image_url,
        p.is_featured,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS seller_name,
        vp.shop_name AS vendor_shop_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.seller_id
      WHERE p.is_active = TRUE
        AND p.approval_status = 'approved'
    `;

    const params = [];

    if (search) {
      sql += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += " AND c.slug = ?";
      params.push(category);
    }

    if (featured === "true") {
      sql += " AND p.is_featured = TRUE";
    }

    if (type) {
      sql += " AND p.product_type = ?";
      params.push(type);
    }

    sql += " ORDER BY p.created_at DESC";

    const [rows] = await db.query(sql, params);

    res.json({ success: true, products: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load products",
      error: error.message,
    });
  }
}

async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS seller_name,
        vp.shop_name AS vendor_shop_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.seller_id
      WHERE p.slug = ?
        AND p.is_active = TRUE
        AND p.approval_status = 'approved'
      LIMIT 1
      `,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({ success: true, product: rows[0] });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load product details",
      error: error.message,
    });
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
};
