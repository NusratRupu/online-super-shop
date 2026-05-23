import { useEffect, useMemo, useRef, useState } from "react";
import api from "./api/client";
import AdminPage from "./AdminPage.jsx";
import LoginPage from "./LoginPage.jsx";
import TrackOrderPage from "./TrackOrderPage.jsx";
import AccountPage from "./AccountPage.jsx";
import CustomerDashboardPage from "./CustomerDashboardPage.jsx";
import CartPage from "./CartPage.jsx";
import CheckoutPage from "./CheckoutPage.jsx";
import VendorDashboardPage from "./VendorDashboardPage.jsx";
import CustomerResalePage from "./CustomerResalePage.jsx";
import DeliverymanLoginPage from "./DeliverymanLoginPage.jsx";
import DeliverymanDashboardPage from "./DeliverymanDashboardPage.jsx";
import { getImageUrl } from "./utils/imageUrl";
import { addToCart, cartCount } from "./utils/cartStore";
import "./styles.css";

function ProductCard({ product, onAddToCart }) {
  const stock = Number(product.stock || 0);
  const isOut = stock <= 0;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={getImageUrl(product.image_url)} alt={product.name} />
        <span>{product.product_type === "resale" ? "Resale" : "Super Shop"}</span>
        <span className={isOut ? "stock-badge out" : "stock-badge"}>
          {isOut ? "Out of Stock" : "In Stock"}
        </span>
      </div>

      <div className="product-info">
        <small>{product.category_name || "General"}</small>
        <h3>{product.name}</h3>
        <p>{product.description}</p>

        {product.product_type === "resale" && product.product_condition && (
          <p>Condition: {String(product.product_condition).replaceAll("_", " ")}</p>
        )}

        <p>Seller: {product.vendor_shop_name || product.seller_name || "NityoMart BD"}</p>

        <div className="price-row">
          <strong>BDT {Number(product.price).toFixed(0)}</strong>
          {product.old_price && <span>BDT {Number(product.old_price).toFixed(0)}</span>}
        </div>

        <p>Available Stock: {stock} {product.unit}</p>

        <button disabled={isOut} onClick={() => onAddToCart(product)}>
          {isOut ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const path = window.location.pathname;
  const productsRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cartTotal, setCartTotal] = useState(cartCount());
  const [toast, setToast] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("nityomart_user") || "null");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [productRes, categoryRes] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);

        setProducts(productRes.data.products || []);
        setCategories(categoryRes.data.categories || []);
      } catch (error) {
        setMessage("Could not load website data. Make sure backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadData();

    function refreshCartCount() {
      setCartTotal(cartCount());
    }

    window.addEventListener("cart-updated", refreshCartCount);
    return () => window.removeEventListener("cart-updated", refreshCartCount);
  }, []);

  if (path.startsWith("/cart")) return <CartPage />;
  if (path.startsWith("/checkout")) return <CheckoutPage />;
  if (path.startsWith("/track-order")) return <TrackOrderPage />;
  if (path.startsWith("/account")) return <CustomerDashboardPage />;

  if (["/login", "/register", "/vendor-login", "/vendor-register"].includes(path)) {
    return <AccountPage />;
  }

  if (path === "/deliveryman-login") {
    return <DeliverymanLoginPage />;
  }

  if (path === "/deliveryman" || path.startsWith("/deliveryman/")) {
    return <DeliverymanDashboardPage />;
  }

  if (path === "/customer-resale" || path.startsWith("/customer-resale/")) {
    return <CustomerResalePage />;
  }

  if (path === "/vendor" || path.startsWith("/vendor/")) {
    return <VendorDashboardPage />;
  }

  if (path.startsWith("/admin")) {
    const user = JSON.parse(localStorage.getItem("nityomart_user") || "null");

    if (!user || user.role !== "admin") {
      return <LoginPage onLogin={() => window.location.reload()} />;
    }

    return (
      <AdminPage
        onLogout={() => {
          localStorage.removeItem("nityomart_token");
          localStorage.removeItem("nityomart_user");
          window.location.reload();
        }}
      />
    );
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.name} ${product.description} ${product.category_name}`.toLowerCase();

      const matchesSearch = !search.trim() || text.includes(search.toLowerCase());
      const matchesType = selectedType === "all" || product.product_type === selectedType;
      const matchesCategory =
        selectedCategory === "all" || product.category_slug === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [products, search, selectedType, selectedCategory]);

  function goToProducts() {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleAddToCart(product) {
    if (currentUser && currentUser.role !== "customer") {
      setToast("Vendor/Admin accounts cannot buy products. Please use a customer account.");
      setTimeout(() => setToast(""), 2600);
      return;
    }

    addToCart(product, 1);
    setCartTotal(cartCount());
    setToast(`${product.name} added to cart`);
    setTimeout(() => setToast(""), 2200);
  }

  const accountHref =
    currentUser?.role === "customer"
      ? "/account"
      : currentUser?.role === "vendor"
        ? "/vendor"
        : "/login";

  const accountText =
    currentUser?.role === "customer"
      ? "My Account"
      : currentUser?.role === "vendor"
        ? "Vendor Panel"
        : "Login";

  return (
    <div>
      <div className="notice-bar">
        <span>
          Multi-Vendor Resale & Super Shop System | Hotline: 01700-000000 | Cash on Delivery Available | Verified Vendor Products
        </span>
      </div>

      <header className="topbar">
        <div className="brand">
          <h1><a className="brand-home-link" href="/">NityoMart BD</a></h1>
          <p>Online Super Shop & Daily Essentials</p>
        </div>

        <div className="search-box">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search grocery, resale items, personal care..."
          />
        </div>

        <nav>
          <a href="/">Home</a>
          <a
            href="#products"
            onClick={(event) => {
              event.preventDefault();
              goToProducts();
            }}
          >
            Shop
          </a>
          <a
            href="/track-order"
            onClick={(event) => {
              if (currentUser?.role === "customer") {
                event.preventDefault();
                window.location.href = "/account";
              } else if (currentUser?.role === "vendor") {
                event.preventDefault();
                window.location.href = "/vendor";
              } else if (currentUser?.role === "admin") {
                event.preventDefault();
                window.location.href = "/admin";
              }
            }}
          >
            Track Order
          </a>
          <a href={currentUser?.role === "vendor" ? "/vendor" : "/vendor-login"}>Vendor</a>
          <a href={currentUser?.role === "deliveryman" ? "/deliveryman" : "/deliveryman-login"}>Deliveryman</a>
          {!currentUser && <a href="/register">Register</a>}
          <button className="cart-btn" onClick={() => (window.location.href = "/cart")}>
            Cart ({cartTotal})
          </button>
          <a className="login-nav-btn" href={accountHref}>{accountText}</a>
        </nav>
      </header>

      {toast && <div className="site-toast">{toast}</div>}
      <main>
        <section className="hero">
          <div className="hero-content">
            <span>Super Shop | Resale | Multi-Vendor</span>
            <h2>Buy daily essentials and verified resale products in one place</h2>
            <p>
              NityoMart BD connects customers with super shop products and approved vendor resale items through a simple cash-on-delivery shopping system.
            </p>
            <div className="hero-actions">
              <button onClick={goToProducts}>Shop Now</button>
              <button className="outline-btn" onClick={() => (window.location.href = "/vendor-register")}>
                Become a Vendor
              </button>
            </div>
          </div>
        </section>

        {message && <div className="admin-message">{message}</div>}

        <section className="section-block">
          <div className="section-title">
            <h2>Shop by Category</h2>
            <p>Browse daily essentials and resale categories</p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <div
                className={`category-card ${selectedCategory === category.slug ? "selected-category" : ""}`}
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.slug);
                  goToProducts();
                }}
              >
                <img src={getImageUrl(category.image_url)} alt={category.name} />
                <h4>{category.name}</h4>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block" id="products" ref={productsRef}>
          <div className="section-title row-title">
            <div>
              <h2>Products</h2>
              <p>Super shop and resale items loaded from MySQL database</p>
            </div>

            <div className="filter-tabs">
              <button className={selectedType === "all" ? "active" : ""} onClick={() => setSelectedType("all")}>All</button>
              <button className={selectedType === "super_shop" ? "active" : ""} onClick={() => setSelectedType("super_shop")}>Super Shop</button>
              <button className={selectedType === "resale" ? "active" : ""} onClick={() => setSelectedType("resale")}>Resale</button>
            </div>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}







