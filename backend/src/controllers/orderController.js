const db = require("../config/db");

function makeOrderNumber() {
  return `NMB-${Date.now()}`;
}

async function placeOrder(req, res) {
  const connection = await db.getConnection();

  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      payment_method = "cash_on_delivery",
      notes,
      items,
    } = req.body;

    if (!customer_name || !customer_phone || !delivery_address) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone, and delivery address are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    await connection.beginTransaction();

    let subtotal = 0;
    const checkedItems = [];

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!productId || !quantity || quantity < 1) {
        throw new Error("Invalid product or quantity");
      }

      const [products] = await connection.query(
        `
        SELECT id, seller_id, name, product_type, price, stock
        FROM products
        WHERE id = ? AND is_active = TRUE AND approval_status = 'approved'
        FOR UPDATE
        `,
        [productId]
      );

      if (products.length === 0) {
        throw new Error("Product not found or unavailable");
      }

      const product = products[0];

      if (Number(product.stock) < quantity) {
        throw new Error(`${product.name} has only ${product.stock} item(s) in stock`);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      checkedItems.push({
        product_id: product.id,
        seller_id: product.seller_id,
        product_name: product.name,
        product_type: product.product_type,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    const deliveryCharge = subtotal >= 1000 ? 0 : 60;
    const totalAmount = subtotal + deliveryCharge;
    const orderNumber = makeOrderNumber();

    const [orderResult] = await connection.query(
      `
      INSERT INTO orders
      (order_number, customer_name, customer_phone, customer_email, delivery_address, payment_method, subtotal, delivery_charge, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        orderNumber,
        customer_name,
        customer_phone,
        customer_email || null,
        delivery_address,
        payment_method,
        subtotal,
        deliveryCharge,
        totalAmount,
        notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of checkedItems) {
      await connection.query(
        `
        INSERT INTO order_items
        (order_id, product_id, seller_id, product_name, product_type, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.product_id,
          item.seller_id,
          item.product_name,
          item.product_type,
          item.quantity,
          item.unit_price,
          item.line_total,
        ]
      );

      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        order_number: orderNumber,
        subtotal,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount,
        status: "pending",
      },
    });
  } catch (error) {
    await connection.rollback();

    res.status(400).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  } finally {
    connection.release();
  }
}

async function trackOrder(req, res) {
  try {
    const { orderNumber, phone } = req.query;

    if (!orderNumber || !phone) {
      return res.status(400).json({
        success: false,
        message: "Order number and phone are required",
      });
    }

    const [orders] = await db.query(
      `
      SELECT *
      FROM orders
      WHERE order_number = ? AND customer_phone = ?
      LIMIT 1
      `,
      [orderNumber, phone]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orders[0].id]
    );

    res.json({
      success: true,
      order: {
        ...orders[0],
        items,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to track order",
      error: error.message,
    });
  }
}

module.exports = {
  placeOrder,
  trackOrder,
};
