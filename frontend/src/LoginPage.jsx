import { useState } from "react";
import api from "./api/client";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const response = await api.post("/auth/login", form);
      const { token, user } = response.data;

      if (user.role !== "admin") {
        setMessage("Only admin can access this panel.");
        return;
      }

      localStorage.setItem("nityomart_token", token);
      localStorage.setItem("nityomart_user", JSON.stringify(user));
      onLogin();
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed.");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin} autoComplete="off">
        <h1>NityoMart BD</h1>
        <h2>Admin Login</h2>
        <p>Only authorized admin users can access product, stock, category, and order management.</p>

        {message && <div className="login-message">{message}</div>}

        <input
          type="email"
          placeholder="Admin Email"
          autoComplete="off"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Admin Password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button type="submit">Login to Admin Panel</button>
        <a href="/">Back to Website</a>
      </form>
    </div>
  );
}

