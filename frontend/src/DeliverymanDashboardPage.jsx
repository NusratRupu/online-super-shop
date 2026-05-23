import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import DeliverymanEarningsPanel from "./DeliverymanEarningsPanel.jsx";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("nityomart_user") || "null");
  } catch {
    return null;
  }
}

function deliveryLabel(status) {
  const labels = {
    unassigned: "Unassigned",
    accepted: "Accepted",
    picked_up: "Picked Up",
    on_the_way: "On The Way",
    delivered_by_deliveryman: "Delivered by Deliveryman",
  };

  return labels[status] || status || "Unassigned";
}

export default function DeliverymanDashboardPage() {
  const user = getCurrentUser();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [activePanel, setActivePanel] = useState("orders");

  async function loadOrders() {
    try {
      const response = await api.get("/deliveryman/orders");
      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load delivery orders.");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "deliveryman") {
      window.location.href = "/deliveryman-login";
      return;
    }

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "assigned") {
      return orders.filter((order) => order.deliveryman_id);
    }

    if (filter === "available") {
      return orders.filter((order) => !order.deliveryman_id);
    }

    return orders;
  }, [orders, filter]);

  async function acceptOrder(orderId) {
    try {
      await api.patch(`/deliveryman/orders/${orderId}/accept`);
      setMessage("Order accepted for delivery.");
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to accept order.");
    }
  }

  async function updateStatus(orderId, deliveryStatus) {
    try {
      await api.patch(`/deliveryman/orders/${orderId}/status`, {
        delivery_status: deliveryStatus,
      });

      setMessage("Delivery status updated.");
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update delivery status.");
    }
  }

  function logout() {
    localStorage.removeItem("nityomart_token");
    localStorage.removeItem("nityomart_user");
    window.location.href = "/";
  }

  return (
    <div className="vendor-dashboard-page">
      <section className="vendor-hero">
        <div>
          <h1>Deliveryman Panel</h1>
          <p>Welcome, {user?.name || "Deliveryman"}. Accept orders and update delivery progress.</p>
        </div>

        <div className="vendor-header-actions">
          <a href="/">Back to Website</a>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </section>

      <section className="vendor-stats">
        <div><strong>{orders.length}</strong><span>Total Eligible Orders</span></div>
        <div><strong>{orders.filter((o) => !o.deliveryman_id).length}</strong><span>Available</span></div>
        <div><strong>{orders.filter((o) => o.deliveryman_id).length}</strong><span>My Accepted</span></div>
        <div><strong>{orders.filter((o) => o.delivery_status === "delivered_by_deliveryman").length}</strong><span>Delivered</span></div>
      </section>

      {message && <div className="admin-message">{message}</div>}

      <div className="vendor-tabs">
        <button className={activePanel === "orders" ? "active" : ""} onClick={() => setActivePanel("orders")}>
          Orders
        </button>
        <button className={activePanel === "earnings" ? "active" : ""} onClick={() => setActivePanel("earnings")}>
          Earnings
        </button>
      </div>

      {activePanel === "earnings" && <DeliverymanEarningsPanel />}

      {activePanel === "orders" && (
      <section className="vendor-card">
        <div className="admin-section-title-row">
          <div>
            <h2>Delivery Orders</h2>
            <p>Confirmed, processing, and shipped orders are available for delivery handling.</p>
          </div>

          <select className="admin-product-search" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="available">Available Orders</option>
            <option value="assigned">My Accepted Orders</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Delivery Status</th>
                <th>Customer Received</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.order_number || `Order #${order.id}`}</strong>
                    <small>{new Date(order.created_at).toLocaleString()}</small>
                  </td>

                  <td>
                    <strong>{order.customer_name || order.customer_user_name || "Customer"}</strong>
                    <small>{order.customer_phone || ""}</small>
                  </td>

                  <td>{order.delivery_address || order.address || "N/A"}</td>
                  <td>BDT {Number(order.total_amount || order.total || 0).toFixed(0)}</td>
                  <td><span className="payment-status approved">{order.status}</span></td>
                  <td><span className="product-approval-badge pending">{deliveryLabel(order.delivery_status)}</span></td>
                  <td>{order.customer_received ? "Confirmed" : "Not Yet"}</td>

                  <td>
                    <div className="user-action-row">
                      {!order.deliveryman_id && (
                        <button type="button" onClick={() => acceptOrder(order.id)}>
                          Take Order
                        </button>
                      )}

                      {order.deliveryman_id && (
                        <>
                          <button type="button" onClick={() => updateStatus(order.id, "picked_up")}>
                            Picked Up
                          </button>
                          <button type="button" onClick={() => updateStatus(order.id, "on_the_way")}>
                            On The Way
                          </button>
                          <button type="button" className="approve-btn" onClick={() => updateStatus(order.id, "delivered_by_deliveryman")}>
                            Mark Delivered
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="8">No eligible delivery orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
}
