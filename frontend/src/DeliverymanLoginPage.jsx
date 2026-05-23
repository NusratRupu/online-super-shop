import { useState } from "react";
import api from "./api/client";

export default function DeliverymanLoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/auth/login", form);
      const user = response.data.user;

      if (user.role !== "deliveryman") {
        setMessage("This login is only for deliveryman accounts.");
        return;
      }

      localStorage.setItem("nityomart_token", response.data.token);
      localStorage.setItem("nityomart_user", JSON.stringify(user));
      window.location.href = "/deliveryman";
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="delivery-login-page">
      <form className="delivery-login-card" onSubmit={handleSubmit}>
        <h1>Deliveryman Login</h1>
        <p>Accept delivery orders and update delivery progress.</p>

        {message && <div className="admin-message">{message}</div>}

        <input
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit">Login as Deliveryman</button>
        <a href="/">Back to Website</a>
      </form>
    </div>
  );
}

