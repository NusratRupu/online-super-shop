import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";
import SellerEarningsPanel from "./SellerEarningsPanel.jsx";

const emptyForm = {
  id: null,
  name: "",
  category_id: "",
  product_mode: "new",
  price: "",
  old_price: "",
  stock: "0",
  unit: "pcs",
  image_url: "",
  description: "",
  is_active: true,
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("nityomart_user") || "null");
  } catch {
    return null;
  }
}

function VendorStockBell({ products, onOpenStock }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  const alerts = useMemo(() => {
    return (products || [])
      .filter((item) => Number(item.stock) <= 3)
      .sort((a, b) => Number(a.stock) - Number(b.stock));
  }, [products]);

  function goToStock(productId) {
    if (productId) sessionStorage.setItem("vendor_focus_stock_product", String(productId));
    onOpenStock();
    setOpen(false);
    setPinned(false);
  }

  return (
    <div
      className="vendor-stock-bell"
      onMouseEnter={() => !pinned && setOpen(true)}
      onMouseLeave={() => !pinned && setOpen(false)}
    >
      <button
        type="button"
        className="vendor-bell-button"
        onClick={() => {
          setPinned((current) => !current);
          setOpen(false);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {alerts.length > 0 && <span>{alerts.length}</span>}
      </button>

      {(open || pinned) && (
        <div className="vendor-alert-panel">
          <div className="vendor-alert-header">
            <strong>My Stock Alerts</strong>
            <button type="button" onClick={() => { setOpen(false); setPinned(false); }}>
              Close
            </button>
          </div>

          {alerts.length === 0 ? (
            <p>No low-stock or out-of-stock products.</p>
          ) : (
            alerts.map((product) => (
              <button
                type="button"
                className="vendor-alert-item"
                key={product.id}
                onClick={() => goToStock(product.id)}
              >
                <strong>{product.name}</strong>
                <small>{product.category_name || "Uncategorized"}</small>
                <em>
                  {Number(product.stock) <= 0
                    ? "Out of Stock"
                    : `Low Stock: ${product.stock} ${product.unit}`}
                </em>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function VendorDashboardPage() {
  const user = getCurrentUser();

  const [activePanel, setActivePanel] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadVendorData() {
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get("/vendor/products"),
        api.get("/categories"),
      ]);

      setProducts(productResponse.data.products || []);
      setCategories(categoryResponse.data.categories || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load vendor data.");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "vendor") {
      window.location.href = "/vendor-login";
      return;
    }

    loadVendorData();
  }, []);

  useEffect(() => {
    const focusId = sessionStorage.getItem("vendor_focus_stock_product");
    if (!focusId || activePanel !== "stock") return;

    setTimeout(() => {
      const row = document.getElementById(`vendor-stock-product-${focusId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.add("stock-row-focus");
        const input = row.querySelector("input");
        if (input) input.focus();
        setTimeout(() => row.classList.remove("stock-row-focus"), 2500);
      }
      sessionStorage.removeItem("vendor_focus_stock_product");
    }, 250);
  }, [activePanel, products.length]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter((product) => {
      const text = `${product.name} ${product.category_name} ${product.product_condition} ${product.approval_status}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [products, search]);

  const filteredStockProducts = useMemo(() => {
    const query = stockSearch.toLowerCase().trim();
    return products.filter((product) => {
      const text = `${product.name} ${product.category_name} ${product.product_condition}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [products, stockSearch]);

  const summary = useMemo(() => {
    return {
      total: products.length,
      pending: products.filter((item) => item.approval_status === "pending").length,
      approved: products.filter((item) => item.approval_status === "approved").length,
      low: products.filter((item) => Number(item.stock) <= 3).length,
    };
  }, [products]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setImageFile(null);
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.image_url;

    const data = new FormData();
    data.append("image", imageFile);

    const response = await api.post("/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.image_url || response.data.url || response.data.path || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const imageUrl = await uploadImageIfNeeded();
      const isNew = form.product_mode === "new";

      const payload = {
        name: form.name,
        category_id: form.category_id,
        product_type: isNew ? "super_shop" : "resale",
        product_condition: isNew ? "new" : form.product_mode,
        price: form.price,
        old_price: isNew ? null : form.old_price,
        stock: form.stock,
        unit: form.unit,
        image_url: imageUrl,
        description: form.description,
        is_active: form.is_active,
      };

      if (!isNew && !payload.old_price) {
        setMessage("Old/original price is required for used/resale products.");
        return;
      }

      if (form.id) {
        await api.put(`/vendor/products/${form.id}`, payload);
        setMessage("Product updated and sent for admin review.");
      } else {
        await api.post("/vendor/products", payload);
        setMessage("Product submitted. Waiting for admin approval.");
      }

      resetForm();
      await loadVendorData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Failed to save product.");
    }
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name || "",
      category_id: product.category_id || "",
      product_mode: product.product_type === "resale" ? product.product_condition || "used_good" : "new",
      price: product.price || "",
      old_price: product.old_price || "",
      stock: product.stock || "0",
      unit: product.unit || "pcs",
      image_url: product.image_url || "",
      description: product.description || "",
      is_active: Boolean(product.is_active),
    });

    setActivePanel("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveStock(productId, stock, unit) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    try {
      await api.put(`/vendor/products/${productId}`, {
        name: product.name,
        category_id: product.category_id,
        product_type: product.product_type,
        product_condition: product.product_condition,
        price: product.price,
        old_price: product.old_price,
        stock,
        unit,
        image_url: product.image_url,
        description: product.description,
        is_active: product.is_active,
      });

      setMessage("Stock updated and sent for admin review.");
      await loadVendorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update stock.");
    }
  }

  async function markOutOfStock(productId) {
    try {
      await api.patch(`/vendor/products/${productId}/out-of-stock`);
      setMessage("Product marked as out of stock.");
      await loadVendorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update stock.");
    }
  }

  async function deleteProduct(productId) {
    if (!confirm("Delete this product from your vendor panel?")) return;

    try {
      await api.delete(`/vendor/products/${productId}`);
      setMessage("Product deleted successfully.");
      await loadVendorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete product.");
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
          <h1>Vendor Panel</h1>
          <p>Welcome, {user?.name || "Vendor"}. Add and manage your own new, used, and resale products.</p>
        </div>

        <div className="vendor-header-actions">
          <VendorStockBell products={products} onOpenStock={() => setActivePanel("stock")} />
          <a href="/">Back to Website</a>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </section>

      <section className="vendor-stats">
        <div><strong>{summary.total}</strong><span>My Products</span></div>
        <div><strong>{summary.pending}</strong><span>Pending Approval</span></div>
        <div><strong>{summary.approved}</strong><span>Approved</span></div>
        <div><strong>{summary.low}</strong><span>Low / Out Stock</span></div>
      </section>

      <div className="vendor-tabs">
        <button className={activePanel === "products" ? "active" : ""} onClick={() => setActivePanel("products")}>
          Products
        </button>
        <button className={activePanel === "stock" ? "active" : ""} onClick={() => setActivePanel("stock")}>
          Stock
        </button>
        <button className={activePanel === "earnings" ? "active" : ""} onClick={() => setActivePanel("earnings")}>
          Earnings
        </button>
      </div>

      {activePanel === "earnings" && (
        <SellerEarningsPanel title="Vendor Earnings & Sale Records" />
      )}

{message && <div className="admin-message">{message}</div>}

      {activePanel === "products" && (
        <>
          <section className="vendor-card">
            <h2>{form.id ? "Edit Product" : "Post New Product"}</h2>

            <form className="vendor-product-form" onSubmit={handleSubmit}>
              <input placeholder="Product Name *" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />

              <select value={form.category_id} onChange={(e) => updateField("category_id", e.target.value)} required>
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
                ))}
              </select>

              <select value={form.product_mode} onChange={(e) => updateField("product_mode", e.target.value)}>
                <option value="new">New Product</option>
                <option value="used_like_new">Used - Like New</option>
                <option value="used_good">Used - Good</option>
                <option value="used_fair">Used - Fair</option>
              </select>

              <input type="number" placeholder="Price *" value={form.price} onChange={(e) => updateField("price", e.target.value)} required />

              {form.product_mode !== "new" && (
                <input type="number" placeholder="Old / Original Price *" value={form.old_price} onChange={(e) => updateField("old_price", e.target.value)} required />
              )}

              <input type="number" min="0" placeholder="Stock Quantity" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
              <input placeholder="Unit" value={form.unit} onChange={(e) => updateField("unit", e.target.value)} />

              <div className="vendor-upload-box">
                <strong>Upload Product Image</strong>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>

              <input placeholder="Or paste direct image URL" value={form.image_url} onChange={(e) => updateField("image_url", e.target.value)} />

              <textarea placeholder="Product Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} />

              <label className="check-row">
                <input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} />
                Active Product
              </label>

              <div className="form-actions">
                <button type="submit">{form.id ? "Update Product" : "Submit Product"}</button>
                <button type="button" className="secondary-btn" onClick={resetForm}>Clear</button>
              </div>
            </form>
          </section>

          <section className="vendor-card">
            <div className="admin-section-title-row">
              <h2>My Product List</h2>
              <input className="admin-product-search" placeholder="Search my products..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Approval</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td><img className="admin-thumb" src={getImageUrl(product.image_url)} alt={product.name} /></td>
                      <td><strong>{product.name}</strong><small>{product.category_name}</small></td>
                      <td>{product.product_type === "resale" ? "Resale / Used" : "New"}</td>
                      <td>BDT {Number(product.price).toFixed(0)}</td>
                      <td className={Number(product.stock) <= 3 ? "low-stock-cell" : ""}>{product.stock} {product.unit}</td>
                      <td><span className={`payment-status ${product.approval_status}`}>{product.approval_status}</span></td>
                      <td>{product.is_active ? "Active" : "Disabled"}</td>
                      <td>
                        <div className="user-action-row">
                          <button type="button" onClick={() => editProduct(product)}>Edit</button>
                          <button type="button" className="danger-btn" onClick={() => markOutOfStock(product.id)}>Out of Stock</button>
                          <button type="button" className="delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && <tr><td colSpan="8">No vendor products found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activePanel === "stock" && (
        <section className="vendor-card">
          <div className="admin-section-title-row">
            <h2>My Stock Management</h2>
            <input className="admin-product-search" placeholder="Search stock..." value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th>Update</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStockProducts.map((product) => {
                  const stock = Number(product.stock || 0);

                  return (
                    <tr key={product.id} id={`vendor-stock-product-${product.id}`}>
                      <td><strong>{product.name}</strong><small>{product.category_name}</small></td>
                      <td><strong>{product.stock} {product.unit}</strong></td>
                      <td>
                        <span className={`stock-admin-badge ${stock <= 0 ? "out" : stock <= 3 ? "low" : "ok"}`}>
                          {stock <= 0 ? "Out of Stock" : stock <= 3 ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td>
                        <div className="stock-edit-row">
                          <input id={`stock-input-${product.id}`} type="number" min="0" defaultValue={product.stock} />
                          <input id={`unit-input-${product.id}`} defaultValue={product.unit || "pcs"} />
                        </div>
                      </td>
                      <td>
                        <div className="user-action-row">
                          <button
                            type="button"
                            onClick={() => saveStock(
                              product.id,
                              document.getElementById(`stock-input-${product.id}`).value,
                              document.getElementById(`unit-input-${product.id}`).value
                            )}
                          >
                            Save
                          </button>
                          <button type="button" className="danger-btn" onClick={() => markOutOfStock(product.id)}>
                            Out of Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredStockProducts.length === 0 && <tr><td colSpan="5">No products found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

