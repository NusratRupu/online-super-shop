export function getCart() {
  try {
    return JSON.parse(localStorage.getItem("nityomart_cart") || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem("nityomart_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      old_price: product.old_price,
      stock: Number(product.stock),
      unit: product.unit,
      image_url: product.image_url,
      category_name: product.category_name,
      product_type: product.product_type,
      product_condition: product.product_condition,
      seller_name: product.vendor_shop_name || product.seller_name || "NityoMart BD",
      quantity,
    });
  }

  saveCart(cart);
}

export function updateCartQuantity(productId, quantity) {
  const cart = getCart();

  const updated = cart
    .map((item) =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, Math.min(Number(quantity), Number(item.stock))) }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCart(updated);
}

export function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.id !== productId));
}

export function clearCart() {
  saveCart([]);
}

export function cartCount() {
  return getCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
}

export function cartSubtotal() {
  return getCart().reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
}
