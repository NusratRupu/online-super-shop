import { useState } from "react";
import api from "./api/client";

export default function DeliverymanRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    area: "",
    vehicle_type: "Bike",
  });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/deliveryman-auth/register", {
        ...form,
        role: "deliveryman",
      });

      setMessage("Deliveryman registration submitted. Please wait for admin approval.");
      setTimeout(() => {
        window.location.href = "/deliveryman-login";
      }, 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed.");
    }
  }

  return (
    <div className="delivery-login-page">
      <form className="delivery-login-card" onSubmit={handleSubmit}>
        <h1>Deliveryman Registration</h1>
        <p>Create a deliveryman account. Admin approval is required before login.</p>

        {message && <div className="admin-message">{message}</div>}

        <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Delivery Area, e.g. Dhaka / Uttara" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />

        <select className="delivery-select" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
          <option value="Bike">Bike</option>
          <option value="Cycle">Cycle</option>
          <option value="Car">Car</option>
          <option value="Van">Van</option>
        </select>

        <button type="submit">Submit Registration</button>
        <div className="delivery-auth-links">
          <a href="/deliveryman-login">Already registered? Login</a>
          <a href="/">Back to Website</a>
        </div>
      </form>
    </div>
  );
}

