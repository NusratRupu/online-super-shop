import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";

const emptyForm = {
  id: null,
  name: "",
  product_condition: "used_good",
  price: "",
  old_price: "",
  stock: "1",
  unit: "pcs",
  image_url: "",
  description: "",
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("nityomart_user") || "null");
  } catch {
    return null;
  }
}

export default function CustomerResalePage() {
  const user = getCurrentUser();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadProducts() {
    try {
      const response = await api.get("/customer/resale-products");
      setProducts(response.data.products || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load resale products.");
    }
  }

  useEffect(() => {
    if (!user || user.role !== "customer") {
      window.location.href = "/login?next=/customer-resale";
      return;
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      const text = `${product.name || ""} ${product.product_condition || ""} ${product.approval_status || ""}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [products, search]);

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

    const response = await api.post("/upload/product-image", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.image_url || response.data.imageUrl || response.data.url || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const imageUrl = await uploadImageIfNeeded();

      const payload = {
        name: form.name,
        product_condition: form.product_condition,
        price: form.price,
        old_price: form.old_price,
        stock: form.stock,
        unit: form.unit,
        image_url: imageUrl,
        description: form.description,
      };

      if (form.id) {
        await api.put(`/customer/resale-products/${form.id}`, payload);
        setMessage("Resale product updated. Waiting for admin re-approval.");
      } else {
        await api.post("/customer/resale-products", payload);
        setMessage("Resale product submitted. Waiting for admin approval.");
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Failed to save resale product.");
    }
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name || "",
      product_condition: product.product_condition || "used_good",
      price: product.price || "",
      old_price: product.old_price || "",
      stock: product.stock || "1",
      unit: product.unit || "pcs",
      image_url: product.image_url || "",
      description: product.description || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function markOutOfStock(productId) {
    try {
      await api.patch(`/customer/resale-products/${productId}/out-of-stock`);
      setMessage("Resale product marked out of stock.");
      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update stock.");
    }
  }

  async function deleteProduct(productId) {
    if (!confirm("Delete this resale product?")) return;

    try {
      await api.delete(`/customer/resale-products/${productId}`);
      setMessage("Resale product deleted successfully.");
      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete resale product.");
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
          <h1>Customer Resale Panel</h1>
          <p>Welcome, {user?.name || "Customer"}. Sell your used/resale products after admin approval.</p>
        </div>

        <div className="vendor-header-actions">
          <a href="/account">My Account</a>
          <a href="/">Back to Website</a>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </section>

      <section className="vendor-stats">
        <div><strong>{summary.total}</strong><span>My Resale Ads</span></div>
        <div><strong>{summary.pending}</strong><span>Pending Approval</span></div>
        <div><strong>{summary.approved}</strong><span>Approved</span></div>
        <div><strong>{summary.low}</strong><span>Low / Out Stock</span></div>
      </section>

      {message && <div className="admin-message">{message}</div>}

      <section className="vendor-card">
        <h2>{form.id ? "Edit Resale Product" : "Post Resale Product"}</h2>

        <form className="vendor-product-form" onSubmit={handleSubmit}>
          <input placeholder="Product Name *" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />

          <select value={form.product_condition} onChange={(e) => updateField("product_condition", e.target.value)}>
            <option value="used_like_new">Used - Like New</option>
            <option value="used_good">Used - Good</option>
            <option value="used_fair">Used - Fair</option>
          </select>

          <input type="number" placeholder="Selling Price *" value={form.price} onChange={(e) => updateField("price", e.target.value)} required />
          <input type="number" placeholder="Old / Original Price *" value={form.old_price} onChange={(e) => updateField("old_price", e.target.value)} required />
          <input type="number" min="0" placeholder="Stock Quantity" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
          <input placeholder="Unit" value={form.unit} onChange={(e) => updateField("unit", e.target.value)} />

          <div className="vendor-upload-box">
            <strong>Upload Resale Product Image</strong>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>

          <input placeholder="Or paste direct image URL" value={form.image_url} onChange={(e) => updateField("image_url", e.target.value)} />

          {form.image_url && (
            <div className="image-preview-box">
              <img src={getImageUrl(form.image_url)} alt="Preview" />
              <small>{form.image_url}</small>
            </div>
          )}

          <textarea placeholder="Product Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} />

          <div className="form-actions">
            <button type="submit">{form.id ? "Update Resale Product" : "Submit Resale Product"}</button>
            <button type="button" className="secondary-btn" onClick={resetForm}>Clear</button>
          </div>
        </form>
      </section>

      <section className="vendor-card">
        <div className="admin-section-title-row">
          <h2>My Resale Product List</h2>
          <input
            className="admin-product-search"
            placeholder="Search my resale products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Condition</th>
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
                  <td><strong>{product.name}</strong><small>Resale Items</small></td>
                  <td>{String(product.product_condition || "").replaceAll("_", " ")}</td>
                  <td>BDT {Number(product.price).toFixed(0)}</td>
                  <td className={Number(product.stock) <= 3 ? "low-stock-cell" : ""}>{product.stock} {product.unit}</td>
                  <td><span className={`product-approval-badge ${product.approval_status || "pending"}`}>{product.approval_status || "pending"}</span></td>
                  <td>{product.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="user-action-row">
                      <button type="button" onClick={() => editProduct(product)}>Edit</button>
                      <button type="button" className="danger-btn" onClick={() => markOutOfStock(product.id)}>Out of Stock</button>
                      <button type="button" className="delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr><td colSpan="8">No resale products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
