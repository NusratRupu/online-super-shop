import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import "./styles.css";
import AdminPage from "./AdminPage.jsx";
import LoginPage from "./LoginPage.jsx";
import TrackOrderPage from "./TrackOrderPage.jsx";
import { getImageUrl } from "./utils/imageUrl";

function getStockLabel(stock) {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 5) return "Low Stock";
  return "In Stock";
}

function ProductCard({ product, onAddToCart }) {
  const stock = Number(product.stock || 0);
  const isOut = stock <= 0;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={getImageUrl(product.image_url)} alt={product.name} />
        <span className={`type-badge ${product.product_type}`}>
          {product.product_type === "resale" ? "Resale" : "Super Shop"}
        </span>
        <span className={`stock-badge ${isOut ? "out" : stock <= 5 ? "low" : "in"}`}>
          {getStockLabel(stock)}
        </span>
      </div>

      <div className="product-info">
        <p className="category-name">{product.category_name}</p>
        <h4>{product.name}</h4>
        <p className="description">{product.description}</p>

        {product.product_type === "resale" && (
          <p className="condition">Condition: {product.product_condition?.replaceAll("_", " ")}</p>
        )}

        <p className="vendor">Seller: {product.vendor_shop_name || "NityoMart BD"}</p>

        <div className="price-row">
          <strong>BDT {Number(product.price).toFixed(0)}</strong>
          {product.old_price && <span>BDT {Number(product.old_price).toFixed(0)}</span>}
        </div>

        <p className="stock-line">Available Stock: {stock} {product.unit}</p>

        <button disabled={isOut} onClick={() => onAddToCart(product)}>
          {isOut ? "Unavailable" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

export default function App() {
  if (window.location.pathname.startsWith("/track-order")) {
    return <TrackOrderPage />;
  }
  if (window.location.pathname.startsWith("/admin")) {
    const user = JSON.parse(localStorage.getItem("nityomart_user") || "null");

    if (!user || user.role !== "admin") {
      return <LoginPage onLogin={() => window.location.reload()} />;
    }

    return <AdminPage onLogout={() => {
      localStorage.removeItem("nityomart_token");
      localStorage.removeItem("nityomart_user");
      window.location.reload();
    }} />;
  }
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkout, setCheckout] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    delivery_address: "",
    notes: "",
  });

  async function loadHomeData() {
    try {
      setLoading(true);
      const productUrl = activeType === "all" ? "/products" : `/products?type=${activeType}`;

      const [categoryRes, productRes] = await Promise.all([
        api.get("/categories"),
        api.get(productUrl),
      ]);

      setCategories(categoryRes.data.categories || []);
      setProducts(productRes.data.products || []);
    } catch (error) {
      console.error("Failed to load homepage data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHomeData();
  }, [activeType]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter((product) =>
      `${product.name} ${product.description} ${product.category_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const deliveryCharge = subtotal >= 1000 || subtotal === 0 ? 0 : 60;
  const total = subtotal + deliveryCharge;

  function handleAddToCart(product) {
    const stock = Number(product.stock || 0);

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= stock) {
          alert("Cannot add more than available stock.");
          return current;
        }

        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setShowCart(true);
  }

  function updateQuantity(productId, nextQuantity) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) return item;
          const safeQty = Math.max(1, Math.min(nextQuantity, Number(item.stock)));
          return { ...item, quantity: safeQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }

  async function placeOrder() {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    if (!checkout.customer_name || !checkout.customer_phone || !checkout.delivery_address) {
      alert("Name, phone, and delivery address are required.");
      return;
    }

    try {
      setPlacingOrder(true);

      const payload = {
        ...checkout,
        payment_method: "cash_on_delivery",
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await api.post("/orders", payload);

      setOrderSuccess(response.data.order);
      setCart([]);
      setCheckout({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        delivery_address: "",
        notes: "",
      });

      await loadHomeData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div>
      <div className="top-strip">
        <div className="marquee-track">
          <span>Multi-Vendor Resale & Super Shop System | Hotline: 01700-000000 | Cash on Delivery Available | Verified Vendor Products</span>
        </div>
      </div>

      <header className="topbar">
        <div className="brand">
          <h1>NityoMart BD</h1>
          <p>Online Super Shop & Daily Essentials</p>
        </div>

        <div className="search-box">
          <input
            type="search"
            placeholder="Search grocery, resale items, personal care..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <nav>
          <a href="/">Home</a>
          <a href="/shop">Shop</a>
          <a href="/track-order">Track Order</a>
          <a href="/vendor">Vendor</a>
          <a href="/admin">Admin</a>
          <button className="cart-btn" onClick={() => setShowCart(true)}>Cart ({cartCount})</button>
        </nav>
      </header>

      <section className="hero">
        <div>
          <span className="badge">Super Shop | Resale | Multi-Vendor</span>
          <h2>Buy daily essentials and verified resale products in one place</h2>
          <p>
            NityoMart BD connects customers with super shop products and approved
            vendor resale items through a simple cash-on-delivery shopping system.
          </p>
          <div className="hero-actions">
            <button>Shop Now</button>
            <button className="outline-btn">Become a Vendor</button>
          </div>
        </div>
      </section>

      <main className="container">
        <section>
          <div className="section-title">
            <h3>Shop by Category</h3>
            <p>Browse daily essentials and resale categories</p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <div className="category-card" key={category.id}>
                <img src={getImageUrl(category.image_url)} alt={category.name} />
                <h4>{category.name}</h4>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-title row-title">
            <div>
              <h3>Products</h3>
              <p>Super shop and resale items loaded from MySQL database</p>
            </div>

            <div className="filter-tabs">
              <button className={activeType === "all" ? "active" : ""} onClick={() => setActiveType("all")}>All</button>
              <button className={activeType === "super_shop" ? "active" : ""} onClick={() => setActiveType("super_shop")}>Super Shop</button>
              <button className={activeType === "resale" ? "active" : ""} onClick={() => setActiveType("resale")}>Resale</button>
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

      {showCart && (
        <div className="cart-overlay">
          <aside className="cart-drawer">
            <div className="cart-header">
              <h3>Shopping Cart</h3>
              <button className="drawer-close-btn" onClick={() => setShowCart(false)}>Close</button>
            </div>

            {orderSuccess && (
              <div className="success-box">
                <h4>Order placed successfully!</h4>
                <p>Order Number: <strong>{orderSuccess.order_number}</strong></p>
                <p>Total: BDT {Number(orderSuccess.total_amount).toFixed(0)}</p>
              </div>
            )}

            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={getImageUrl(item.image_url)} alt={item.name} />
                      <div>
                        <h4>{item.name}</h4>
                        <p>BDT {Number(item.price).toFixed(0)} × {item.quantity}</p>
                        <p>Stock: {item.stock}</p>
                        <div className="qty-row">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="checkout-box">
                  <h3>Checkout</h3>

                  <input placeholder="Customer Name *" value={checkout.customer_name} onChange={(e) => setCheckout({ ...checkout, customer_name: e.target.value })} />
                  <input placeholder="Phone Number *" value={checkout.customer_phone} onChange={(e) => setCheckout({ ...checkout, customer_phone: e.target.value })} />
                  <input placeholder="Email Optional" value={checkout.customer_email} onChange={(e) => setCheckout({ ...checkout, customer_email: e.target.value })} />
                  <textarea placeholder="Delivery Address *" value={checkout.delivery_address} onChange={(e) => setCheckout({ ...checkout, delivery_address: e.target.value })} />
                  <textarea placeholder="Order Notes Optional" value={checkout.notes} onChange={(e) => setCheckout({ ...checkout, notes: e.target.value })} />

                  <div className="summary">
                    <p><span>Subtotal</span><strong>BDT {subtotal.toFixed(0)}</strong></p>
                    <p><span>Delivery Charge</span><strong>BDT {deliveryCharge.toFixed(0)}</strong></p>
                    <p><span>Total</span><strong>BDT {total.toFixed(0)}</strong></p>
                    <p><span>Payment</span><strong>Cash on Delivery</strong></p>
                  </div>

                  <button className="place-order-btn" disabled={placingOrder} onClick={placeOrder}>
                    {placingOrder ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}






