import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import "./styles.css";

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
        <img src={product.image_url} alt={product.name} />
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

        <p className="vendor">
          Seller: {product.vendor_shop_name || "NityoMart BD"}
        </p>

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
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadHomeData() {
    try {
      setLoading(true);

      const productUrl =
        activeType === "all" ? "/products" : `/products?type=${activeType}`;

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

  function handleAddToCart(product) {
    if (Number(product.stock) <= 0) return;
    setCartCount((current) => current + 1);
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
          <button className="cart-btn">Cart ({cartCount})</button>
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
                <img src={category.image_url} alt={category.name} />
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
              <button className={activeType === "all" ? "active" : ""} onClick={() => setActiveType("all")}>
                All
              </button>
              <button className={activeType === "super_shop" ? "active" : ""} onClick={() => setActiveType("super_shop")}>
                Super Shop
              </button>
              <button className={activeType === "resale" ? "active" : ""} onClick={() => setActiveType("resale")}>
                Resale
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

