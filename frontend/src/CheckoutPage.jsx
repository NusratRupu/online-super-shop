import { useMemo, useState } from "react";
import api from "./api/client";
import { getCart, clearCart, cartSubtotal } from "./utils/cartStore";
import { getImageUrl } from "./utils/imageUrl";

const paymentLabels = {
  cash_on_delivery: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  bank_transfer: "Bank Transfer",
};

export default function CheckoutPage() {
  const cart = getCart();
  const user = JSON.parse(localStorage.getItem("nityomart_user") || "null");

  if (!user || user.role !== "customer") {
    return (
      <div className="checkout-page">
        <section className="checkout-success">
          <h1>Customer Login Required</h1>
          <p>Please login as a customer before placing an order. You can add items to cart without login, but checkout requires a customer account.</p>
          <div className="checkout-success-actions">
            <a href="/login?next=/checkout">Customer Login</a>
            <a href="/register?next=/checkout">Create Account</a>
            <a href="/cart">Back to Cart</a>
          </div>
        </section>
      </div>
    );
  }

  const [form, setForm] = useState({
    customer_name: user?.name || "",
    customer_phone: user?.phone || "",
    customer_email: user?.email || "",
    delivery_address: "",
    notes: "",
    payment_method: "cash_on_delivery",
    payment_reference: "",
  });

  const [message, setMessage] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  const subtotal = cartSubtotal();
  const deliveryCharge = subtotal >= 1000 ? 0 : 60;
  const total = subtotal + deliveryCharge;

  const items = useMemo(() => {
    return cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));
  }, [cart]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    setMessage("");

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (form.payment_method !== "cash_on_delivery" && !form.payment_reference.trim()) {
      setMessage("Transaction/reference number is required for selected payment method.");
      return;
    }

    try {
      const response = await api.post("/orders", {
        ...form,
        items,
      });

      setSuccessOrder(response.data.order);
      clearCart();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to place order.");
    }
  }

  if (successOrder) {
    return (
      <div className="checkout-page">
        <section className="checkout-success">
          <h1>Order placed successfully!</h1>
          <p><strong>Order Number:</strong> {successOrder.order_number}</p>
          <p><strong>Total:</strong> BDT {Number(successOrder.total_amount).toFixed(0)}</p>
          <p><strong>Payment:</strong> {paymentLabels[successOrder.payment_method]}</p>
          <p><strong>Payment Status:</strong> {successOrder.payment_status}</p>
          <div className="checkout-success-actions">
            <a href="/account">View My Orders</a>
            <a href="/">Back to Website</a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="cart-page-header">
        <div>
          <h1>Secure Checkout</h1>
          <p>Complete delivery and payment details to confirm your order.</p>
        </div>
        <a href="/cart">Back to Cart</a>
      </header>

      {message && <div className="login-message">{message}</div>}

      <div className="checkout-layout">
        <form className="checkout-form-card" onSubmit={placeOrder}>
          <h2>Delivery Information</h2>

          <input placeholder="Customer Name *" value={form.customer_name} onChange={(e) => updateField("customer_name", e.target.value)} />
          <input placeholder="Phone Number *" value={form.customer_phone} onChange={(e) => updateField("customer_phone", e.target.value)} />
          <input placeholder="Email Optional" value={form.customer_email} onChange={(e) => updateField("customer_email", e.target.value)} />
          <textarea placeholder="Delivery Address *" value={form.delivery_address} onChange={(e) => updateField("delivery_address", e.target.value)} />
          <textarea placeholder="Order Notes Optional" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />

          <h3>Payment Method</h3>

          <div className="payment-options">
            {Object.entries(paymentLabels).map(([value, label]) => (
              <label className={form.payment_method === value ? "selected" : ""} key={value}>
                <input
                  type="radio"
                  name="payment_method"
                  value={value}
                  checked={form.payment_method === value}
                  onChange={(e) => updateField("payment_method", e.target.value)}
                />
                {label}
              </label>
            ))}
          </div>

          {form.payment_method !== "cash_on_delivery" && (
            <div className="payment-instruction">
              <strong>{paymentLabels[form.payment_method]} Payment Reference</strong>
              <p>Enter the transaction ID/reference number after sending payment manually.</p>
              <input
                placeholder="Transaction ID / Bank Reference Number *"
                value={form.payment_reference}
                onChange={(e) => updateField("payment_reference", e.target.value)}
              />
            </div>
          )}

          <button type="submit">Place Order</button>
        </form>

        <aside className="checkout-summary-card">
          <h2>Your Bill</h2>
          <div><span>Sub-Total</span><strong>BDT {subtotal.toFixed(0)}</strong></div>
          <div><span>Delivery</span><strong>{deliveryCharge === 0 ? "Free" : `BDT ${deliveryCharge}`}</strong></div>
          <div className="bill-total"><span>Total</span><strong>BDT {total.toFixed(0)}</strong></div>

          <h3>Product Items</h3>
          {cart.map((item) => (
            <div className="checkout-item" key={item.id}>
              <img src={getImageUrl(item.image_url)} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <small>{item.quantity} x BDT {Number(item.price).toFixed(0)}</small>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}


