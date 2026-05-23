import { useMemo, useState } from "react";
import api from "./api/client";

function getNextPath() {
  const params = new URLSearchParams(window.location.search);
  return params.get("next") || "";
}

export default function AccountPage() {
  const path = window.location.pathname;
  const nextPath = getNextPath();

  const mode = useMemo(() => {
    if (path.includes("vendor-register")) return "vendor-register";
    if (path.includes("vendor-login")) return "vendor-login";
    if (path.includes("register")) return "customer-register";
    return "customer-login";
  }, [path]);

  const isRegister = mode.includes("register");
  const isVendor = mode.includes("vendor");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    shop_name: "",
    shop_phone: "",
    shop_address: "",
  });

  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      if (isRegister) {
        const response = await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: isVendor ? "vendor" : "customer",
          shop_name: form.shop_name,
          shop_phone: form.shop_phone,
          shop_address: form.shop_address,
        });

        setMessage(response.data.message || "Registration successful.");

        if (!isVendor) {
          setTimeout(() => {
            window.location.href = nextPath
              ? `/login?next=${encodeURIComponent(nextPath)}`
              : "/login";
          }, 900);
        }

        return;
      }

      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const { token, user } = response.data;

      if (isVendor && user.role !== "vendor") {
        setMessage("Only vendor accounts can login here.");
        return;
      }

      if (!isVendor && user.role !== "customer") {
        setMessage("Only customer accounts can login here.");
        return;
      }

      localStorage.setItem("nityomart_token", token);
      localStorage.setItem("nityomart_user", JSON.stringify(user));

      if (!isVendor && nextPath) {
        window.location.href = nextPath;
        return;
      }

      window.location.href = isVendor ? "/vendor" : "/";
    } catch (error) {
      setMessage(error.response?.data?.message || "Request failed.");
    }
  }

  return (
    <div className="account-page">
      <form className="account-card" onSubmit={handleSubmit} autoComplete="off">
        <h1>NityoMart BD</h1>
        <h2>
          {isVendor
            ? isRegister
              ? "Vendor / Reseller Registration"
              : "Vendor Login"
            : isRegister
              ? "Create Customer Account"
              : "Customer Login"}
        </h2>

        <p>
          {isVendor
            ? "Register as a vendor/reseller to post and manage your listings after admin approval."
            : "Create an account to checkout and view your orders from your dashboard."}
        </p>

        {message && <div className="login-message">{message}</div>}

        {isRegister && (
          <>
            <input placeholder="Full Name *" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            <input placeholder="Phone Number" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </>
        )}

        <input type="email" placeholder="Email *" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
        <input type="password" placeholder="Password *" value={form.password} onChange={(e) => updateField("password", e.target.value)} />

        {isVendor && isRegister && (
          <>
            <input placeholder="Shop / Reseller Name *" value={form.shop_name} onChange={(e) => updateField("shop_name", e.target.value)} />
            <input placeholder="Shop Phone" value={form.shop_phone} onChange={(e) => updateField("shop_phone", e.target.value)} />
            <textarea placeholder="Shop Address" value={form.shop_address} onChange={(e) => updateField("shop_address", e.target.value)} />
          </>
        )}

        <button type="submit">{isRegister ? "Create Account" : "Login"}</button>

        <div className="account-links">
          <a href="/">Back to Website</a>
          {isVendor ? (
            isRegister ? <a href="/vendor-login">Vendor Login</a> : <a href="/vendor-register">Register as Vendor</a>
          ) : (
            isRegister
              ? <a href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}>Customer Login</a>
              : <a href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}>Create Customer Account</a>
          )}
        </div>
      </form>
    </div>
  );
}

