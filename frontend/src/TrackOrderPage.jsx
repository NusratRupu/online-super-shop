import { useState } from "react";
import api from "./api/client";

export default function TrackOrderPage() {
  const [form, setForm] = useState({
    orderNumber: "",
    phone: "",
  });
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTrack(event) {
    event.preventDefault();
    setMessage("");
    setOrder(null);

    if (!form.orderNumber || !form.phone) {
      setMessage("Order number and phone number are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/orders/track", {
        params: {
          orderNumber: form.orderNumber,
          phone: form.phone,
        },
      });

      setOrder(response.data.order);
    } catch (error) {
      setMessage(error.response?.data?.message || "Order not found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="track-page">
      <div className="track-card">
        <h1>NityoMart BD</h1>
        <h2>Track Your Order</h2>
        <p>Enter your order number and phone number to check current order status.</p>

        <form className="track-form" onSubmit={handleTrack}>
          <input
            placeholder="Order Number, e.g. NMB-1779446991803"
            value={form.orderNumber}
            onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
          />
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Track Order"}
          </button>
        </form>

        {message && <div className="login-message">{message}</div>}

        {order && (
          <div className="track-result">
            <h3>Order Found</h3>
            <p><strong>Order Number:</strong> {order.order_number}</p>
            <p><strong>Customer:</strong> {order.customer_name}</p>
            <p><strong>Phone:</strong> {order.customer_phone}</p>
            <p><strong>Status:</strong> <span className={`order-status ${order.status}`}>{order.status}</span></p>
            <p><strong>Total:</strong> BDT {Number(order.total_amount).toFixed(0)}</p>
            <p><strong>Address:</strong> {order.delivery_address}</p>

            <h4>Items</h4>
            {order.items.map((item) => (
              <div className="track-item" key={item.id}>
                <span>{item.product_name}</span>
                <span>{item.quantity} x BDT {Number(item.unit_price).toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        <a className="track-back" href="/">Back to Website</a>
      </div>
    </div>
  );
}

