import { useEffect, useState } from "react";
import { getCart, updateCartQuantity, removeFromCart, cartSubtotal } from "./utils/cartStore";
import { getImageUrl } from "./utils/imageUrl";

export default function CartPage() {
  const [cart, setCart] = useState(getCart());

  function refreshCart() {
    setCart(getCart());
  }

  useEffect(() => {
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  const subtotal = cartSubtotal();

  return (
    <div className="cart-page">
      <header className="cart-page-header">
        <div>
          <h1>Shopping Cart</h1>
          <p>Review your selected products before checkout.</p>
        </div>
        <a href="/">Continue Shopping</a>
      </header>

      {cart.length === 0 ? (
        <section className="admin-card">
          <h2>Your cart is empty</h2>
          <p>Add products from the shop first.</p>
          <a className="primary-link-btn" href="/">Shop Now</a>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-card">
            <h2>Product Items</h2>

            {cart.map((item, index) => (
              <article className="cart-line-item" key={item.id}>
                <img src={getImageUrl(item.image_url)} alt={item.name} />

                <div className="cart-line-info">
                  <small>SN. {index + 1}</small>
                  <h3>{item.name}</h3>
                  <p>{item.category_name}</p>
                  <p>Seller: {item.seller_name}</p>
                  <strong>Unit Price: BDT {Number(item.price).toFixed(0)}</strong>
                </div>

                <div className="cart-line-actions">
                  <div className="qty-control">
                    <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>

                  <strong>BDT {(Number(item.price) * Number(item.quantity)).toFixed(0)}</strong>
                  <button className="remove-cart-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </article>
            ))}
          </section>

          <aside className="bill-card">
            <h2>Your Bill</h2>
            <div><span>Sub-Total</span><strong>BDT {subtotal.toFixed(0)}</strong></div>
            <div><span>Delivery</span><strong>{subtotal >= 1000 ? "Free" : "BDT 60"}</strong></div>
            <div className="bill-total">
              <span>Total</span>
              <strong>BDT {(subtotal + (subtotal >= 1000 ? 0 : 60)).toFixed(0)}</strong>
            </div>
            <a href="/checkout">Go To Checkout</a>
          </aside>
        </div>
      )}
    </div>
  );
}
