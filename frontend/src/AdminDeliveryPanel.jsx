import { useEffect, useState } from "react";
import api from "./api/client";

function label(value) {
  return String(value || "unassigned").replaceAll("_", " ");
}

export default function AdminDeliveryPanel() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    try {
      const response = await api.get("/admin/delivery/orders");
      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load delivery orders.");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function approvePayout(orderId) {
    try {
      await api.patch(`/admin/delivery/orders/${orderId}/approve-payout`);
      setMessage("Deliveryman payout/points approved.");
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to approve payout.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Delivery Management</h2>
      <p>Track deliveryman assignment, delivery progress, customer confirmation, and payout approval.</p>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Deliveryman</th>
              <th>Order Status</th>
              <th>Delivery Status</th>
              <th>Customer Received</th>
              <th>Payout / Points</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.order_number || `Order #${order.id}`}</strong>
                  <small>{new Date(order.created_at).toLocaleString()}</small>
                </td>

                <td>
                  <strong>{order.customer_name || "Customer"}</strong>
                  <small>{order.customer_phone || ""}</small>
                </td>

                <td>
                  {order.deliveryman_name ? (
                    <>
                      <strong>{order.deliveryman_name}</strong>
                      <small>{order.deliveryman_phone || ""}</small>
                      <small>{order.deliveryman_area || ""} {order.vehicle_type || ""}</small>
                    </>
                  ) : (
                    "Not assigned"
                  )}
                </td>

                <td><span className="payment-status approved">{order.status}</span></td>
                <td><span className="product-approval-badge pending">{label(order.delivery_status)}</span></td>
                <td>{order.customer_received ? "Confirmed" : "Not Yet"}</td>

                <td>
                  <strong>{order.delivery_payout_status || "pending"}</strong>
                  <small>{Number(order.delivery_points || 10)} points</small>
                </td>

                <td>
                  {order.deliveryman_id &&
                  order.customer_received &&
                  order.delivery_status === "delivered_by_deliveryman" &&
                  order.delivery_payout_status !== "approved" ? (
                    <button className="approve-btn" onClick={() => approvePayout(order.id)}>
                      Approve Payout
                    </button>
                  ) : (
                    <span>N/A</span>
                  )}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="8">No delivery orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
