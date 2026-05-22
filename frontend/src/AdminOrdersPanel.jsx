import { useEffect, useState } from "react";
import api from "./api/client";

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
];

const paymentStatuses = ["pending", "submitted", "verified", "rejected"];

const paymentLabels = {
  cash_on_delivery: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  bank_transfer: "Bank Transfer",
};

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    try {
      const response = await api.get("/admin/orders");
      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load orders.");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrderStatus(orderId, status) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setMessage("Order status updated successfully.");
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update order status.");
    }
  }

  async function updatePaymentStatus(orderId, payment_status) {
    try {
      await api.patch(`/admin/orders/${orderId}/payment`, { payment_status });
      setMessage("Payment status updated successfully.");
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update payment status.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Order Management</h2>
      <p>Confirm orders, track delivery status, and verify bKash/Nagad/Bank payments.</p>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Products</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Payment Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.order_number}</strong>
                  <small>{new Date(order.created_at).toLocaleString()}</small>
                </td>

                <td>
                  <strong>{order.customer_name}</strong>
                  <small>{order.customer_phone}</small>
                  <small>{order.delivery_address}</small>
                </td>

                <td>
                  <strong>{order.items?.length || 0} item(s)</strong>
                  {(order.items || []).map((item) => (
                    <small key={item.id}>
                      {item.product_name} × {item.quantity}
                    </small>
                  ))}
                </td>

                <td>BDT {Number(order.total_amount).toFixed(0)}</td>

                <td>
                  <strong>{paymentLabels[order.payment_method] || order.payment_method}</strong>
                  {order.payment_reference && (
                    <small>Ref: {order.payment_reference}</small>
                  )}
                </td>

                <td>
                  <span className={`order-status ${order.status}`}>{order.status}</span>
                  <select
                    value={order.status}
                    onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                  >
                    {orderStatuses.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <span className={`payment-status ${order.payment_status || "pending"}`}>
                    {order.payment_status || "pending"}
                  </span>
                  <select
                    value={order.payment_status || "pending"}
                    onChange={(event) => updatePaymentStatus(order.id, event.target.value)}
                  >
                    {paymentStatuses.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="7">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
