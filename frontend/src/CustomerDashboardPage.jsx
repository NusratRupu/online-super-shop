import { useEffect, useState } from "react";
import api from "./api/client";

const orderSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

function OrderProgress({ status }) {
  if (status === "cancelled" || status === "rejected") {
    return <div className="order-progress stopped">Order {status}</div>;
  }

  const activeIndex = orderSteps.indexOf(status);

  return (
    <div className="order-progress">
      {orderSteps.map((step, index) => (
        <div className={`progress-step ${index <= activeIndex ? "done" : ""}`} key={step}>
          <span>{index + 1}</span>
          <small>{step}</small>
        </div>
      ))}
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("nityomart_user") || "null");

  async function loadOrders() {
    try {
      const response = await api.get("/orders/my");
      setOrders(response.data.orders || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Please login as customer.");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "customer") {
      window.location.href = "/login";
      return;
    }

    loadOrders();
  }, []);

  function logout() {
    localStorage.removeItem("nityomart_token");
    localStorage.removeItem("nityomart_user");
    window.location.href = "/";
  }

  return (
    <div className="account-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>My Account</h1>
          <p>Welcome, {user?.name}. Track your current and previous orders.</p>
        </div>
        <div className="dashboard-actions">
          <a href="/">Back to Website</a>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {message && <div className="admin-message">{message}</div>}

      <section className="admin-card">
        <h2>My Orders</h2>

        {orders.length === 0 ? (
          <p>No account-linked orders found yet. Place an order while logged in to see it here.</p>
        ) : (
          <div className="order-card-grid">
            {orders.map((order) => (
              <article className="customer-order-card" key={order.id}>
                <div className="customer-order-head">
                  <div>
                    <h3>{order.order_number}</h3>
                    <p>{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`order-status ${order.status}`}>{order.status}</span>
                </div>

                <OrderProgress status={order.status} />

                <p><strong>Total:</strong> BDT {Number(order.total_amount).toFixed(0)}</p>
                <p><strong>Phone:</strong> {order.customer_phone || user?.phone || "Not available"}</p>
                <p><strong>Payment:</strong> Cash on Delivery</p>
                <p><strong>Address:</strong> {order.delivery_address}</p>

                <div className="customer-order-items">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      <span>{item.product_name}</span>
                      <strong>{item.quantity} x BDT {Number(item.unit_price).toFixed(0)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

