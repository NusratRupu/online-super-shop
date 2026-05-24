import { useEffect, useState } from "react";
import api from "./api/client";

function label(value) {
  return String(value || "unassigned").replaceAll("_", " ");
}

export default function AdminDeliveryPanel() {
  const [orders, setOrders] = useState([]);
  const [deliverymen, setDeliverymen] = useState([]);
  const [message, setMessage] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState(null);

  async function loadAll() {
    try {
      const [ordersRes, deliverymenRes] = await Promise.all([
        api.get("/admin/delivery/orders"),
        api.get("/admin/delivery/deliverymen"),
      ]);

      setOrders(ordersRes.data.orders || []);
      setDeliverymen(deliverymenRes.data.deliverymen || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load delivery data.");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approvePayout(orderId) {
    try {
      setProcessingOrderId(orderId);
      const res = await api.patch(`/admin/delivery/orders/${orderId}/approve-payout`);
      setMessage(res.data?.message || "Settlement updated.");
      await loadAll();
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.message || "Failed to approve payout.");
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function approveDeliveryman(userId) {
    try {
      await api.patch(`/admin/delivery/deliverymen/${userId}/approve`);
      setMessage("Deliveryman approved.");
      await loadAll();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to approve deliveryman.");
    }
  }

  async function blockDeliveryman(userId) {
    try {
      await api.patch(`/admin/delivery/deliverymen/${userId}/block`);
      setMessage("Deliveryman blocked.");
      await loadAll();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to block deliveryman.");
    }
  }

  return (
    <>
      <section className="admin-card">
        <h2>Deliveryman Accounts</h2>
        <p>Approve newly registered deliverymen and manage their access.</p>

        {message && <div className="admin-message">{message}</div>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Deliveryman</th>
                <th>Area</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Points</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliverymen.map((person) => (
                <tr key={person.id}>
                  <td>
                    <strong>{person.name}</strong>
                    <small>{person.email}</small>
                    <small>{person.phone}</small>
                  </td>
                  <td>{person.area || "N/A"}</td>
                  <td>{person.vehicle_type || "N/A"}</td>
                  <td>{person.status}</td>
                  <td>{person.approval_status || "pending"}</td>
                  <td>{Number(person.points || 0)}</td>
                  <td>
                    <div className="user-action-row">
                      {person.status !== "active" && (
                        <button type="button" onClick={() => approveDeliveryman(person.id)}>Approve</button>
                      )}
                      {person.status === "active" && (
                        <button type="button" className="danger-btn" onClick={() => blockDeliveryman(person.id)}>Block</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {deliverymen.length === 0 && <tr><td colSpan="7">No deliverymen found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <h2>Delivery Management</h2>
        <p>Track deliveryman assignment, delivery progress, customer confirmation, and payout approval.</p>

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
                    <strong>{order.order_number}</strong>
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
                    order.delivery_status === "delivered_by_deliveryman" ? (
                      <button
                        className="approve-btn"
                        disabled={processingOrderId === order.id || Number(order.seller_settlement_count || 0) > 0}
                        onClick={() => approvePayout(order.id)}
                      >
                        {processingOrderId === order.id
                          ? "Processing..."
                          : Number(order.seller_settlement_count || 0) > 0
                            ? "Settlement Done"
                            : order.delivery_payout_status === "approved"
                              ? "Verify Seller Settlement"
                              : "Approve Payout"}
                      </button>
                    ) : (
                      <span>N/A</span>
                    )}
                  </td>
                </tr>
              ))}

              {orders.length === 0 && <tr><td colSpan="8">No delivery orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
