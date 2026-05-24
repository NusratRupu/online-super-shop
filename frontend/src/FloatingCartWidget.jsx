import { useEffect, useMemo, useState } from "react";
import { cartCount } from "./utils/cartStore";
import { getImageUrl } from "./utils/imageUrl";

function readCartItems() {
  const possibleKeys = [
    "nityomart_cart",
    "nityomart_bd_cart",
    "cart",
    "cart_items",
  ];

  for (const key of possibleKeys) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.items)) return parsed.items;
    } catch {
      // try next key
    }
  }

  return [];
}

export default function FloatingCartWidget() {
  const [count, setCount] = useState(cartCount());
  const [items, setItems] = useState(readCartItems());

  function refreshCart() {
    setCount(cartCount());
    setItems(readCartItems());
  }

  useEffect(() => {
    refreshCart();

    window.addEventListener("cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener("cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  const path = window.location.pathname;
  const hide =
    path.startsWith("/cart") ||
    path.startsWith("/checkout") ||
    path.startsWith("/admin") ||
    path.startsWith("/vendor") ||
    path.startsWith("/deliveryman");

  const previewItems = useMemo(() => items.slice(0, 4), [items]);

  if (hide || count <= 0) return null;

  return (
    <div className="floating-cart-wrap">
      <button className="floating-cart-btn" onClick={() => (window.location.href = "/cart")} aria-label="Open cart">
        <svg viewBox="0 0 24 24" className="floating-cart-svg">
          <path d="M4 5h2l2 10h10l2-7H8" />
          <circle cx="10" cy="19" r="1.8" />
          <circle cx="18" cy="19" r="1.8" />
        </svg>
        <span>{count}</span>
      </button>

      <div className="floating-cart-preview">
        <h4>Cart Items</h4>

        {previewItems.map((item, index) => (
          <div className="floating-cart-item" key={`${item.id || item.product_id || index}-${index}`}>
            {item.image_url && <img src={getImageUrl(item.image_url)} alt={item.name || "Product"} />}
            <div>
              <strong>{item.name || item.product_name || "Product"}</strong>
              <small>Qty: {item.quantity || item.qty || 1}</small>
              <small>BDT {Number(item.price || item.unit_price || 0).toFixed(0)}</small>
            </div>
          </div>
        ))}

        {items.length > 4 && <p>+{items.length - 4} more item(s)</p>}

        <button onClick={() => (window.location.href = "/cart")}>View Cart</button>
      </div>
    </div>
  );
}
