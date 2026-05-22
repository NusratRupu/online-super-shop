import { useEffect, useState } from "react";
import api from "./api/client";

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
];

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await api.get("/admin/orders");
      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId, status) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setMessage("Order status updated successfully.");
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update order.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Order Management</h2>
      <p className="admin-subtitle">
        Confirm, process, ship, deliver, cancel, or reject customer orders.
      </p>

      {message && <div className="admin-message">{message}</div>}

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Status</th>
                <th>Change Status</th>
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
                    <strong>{order.item_count} item(s)</strong>
                    <small>{order.product_names}</small>
                  </td>
                  <td>BDT {Number(order.total_amount).toFixed(0)}</td>
                  <td>
                    <span className={`order-status ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
