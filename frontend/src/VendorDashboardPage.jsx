import { useEffect, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";

const emptyForm = {
  category_id: "",
  name: "",
  description: "",
  product_condition: "used_good",
  price: "",
  old_price: "",
  stock: "1",
  unit: "piece",
  image_url: "",
};

export default function VendorDashboardPage() {
  const user = JSON.parse(localStorage.getItem("nityomart_user") || "null");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");

  if (!user || user.role !== "vendor") {
    window.location.href = "/vendor-login";
    return null;
  }

  async function loadData() {
    try {
      const [categoryRes, productRes] = await Promise.all([
        api.get("/categories"),
        api.get("/vendor/products"),
      ]);

      setCategories(categoryRes.data.categories || []);
      setProducts(productRes.data.products || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load vendor panel data.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.image_url;

    const data = new FormData();
    data.append("image", imageFile);

    const response = await api.post("/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.url || response.data.image_url;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const imageUrl = await uploadImageIfNeeded();

      const payload = {
        ...form,
        image_url: imageUrl,
      };

      if (editingId) {
        await api.put(`/vendor/products/${editingId}`, payload);
        setMessage("Product updated and sent for admin re-approval.");
      } else {
        await api.post("/vendor/products", payload);
        setMessage("Product submitted. Waiting for admin approval.");
      }

      setForm(emptyForm);
      setEditingId(null);
      setImageFile(null);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.message || error.message || "Failed to save product.");
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      category_id: product.category_id || "",
      name: product.name || "",
      description: product.description || "",
      product_condition: product.product_condition || "used_good",
      price: product.price || "",
      old_price: product.old_price || "",
      stock: product.stock || "1",
      unit: product.unit || "piece",
      image_url: product.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(productId) {
    if (!confirm("Delete this product?")) return;

    try {
      await api.delete(`/vendor/products/${productId}`);
      setMessage("Product deleted successfully.");
      await loadData();
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
    <div className="account-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Vendor Panel</h1>
          <p>Welcome, {user.name}. Add and manage only your own resale products.</p>
        </div>

        <div className="dashboard-actions">
          <a href="/">Back to Website</a>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {message && <div className="admin-message">{message}</div>}

      <section className="admin-card">
        <h2>{editingId ? "Edit Product Listing" : "Post New Product Ad"}</h2>

        <form className="vendor-form" onSubmit={handleSubmit}>
          <input placeholder="Product Name *" value={form.name} onChange={(e) => updateField("name", e.target.value)} />

          <select value={form.category_id} onChange={(e) => updateField("category_id", e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>{category.name}</option>
            ))}
          </select>

          <select value={form.product_condition} onChange={(e) => updateField("product_condition", e.target.value)}>
            <option value="new">New</option>
            <option value="used_like_new">Used - Like New</option>
            <option value="used_good">Used - Good</option>
            <option value="used_fair">Used - Fair</option>
            </select>

          <input placeholder="Price *" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
          {form.product_condition !== "new" && (
            <input placeholder="Old / Original Price *" value={form.old_price || ""} onChange={(e) => updateField("old_price", e.target.value)} />
          )}
          <input placeholder="Stock Quantity" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
          <input placeholder="Unit, e.g. piece" value={form.unit} onChange={(e) => updateField("unit", e.target.value)} />

          <div className="upload-box">
            <strong>Upload Product Image</strong>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>

          <input placeholder="Or paste direct image URL" value={form.image_url || ""} onChange={(e) => updateField("image_url", e.target.value)} />
          <textarea placeholder="Product Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} />

          <div className="form-actions">
            <button type="submit">{editingId ? "Update Product" : "Submit Product"}</button>
            {editingId && (
              <button type="button" className="secondary-btn" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-card">
        <h2>My Product Listings</h2>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><img className="admin-thumb" src={getImageUrl(product.image_url)} alt={product.name} /></td>
                  <td>
                    <strong>{product.name}</strong>
                    <small>{product.category_name}</small>
                    <small>{String(product.product_condition || "").replaceAll("_", " ")}</small>
                  </td>
                  <td>BDT {Number(product.price).toFixed(0)}</td>
                  <td>{product.stock} {product.unit}</td>
                  <td><span className={`user-status ${product.approval_status}`}>{product.approval_status}</span></td>
                  <td>{product.is_active ? "Active" : "Disabled"}</td>
                  <td>
                    <div className="user-action-row">
                      <button type="button" onClick={() => editProduct(product)}>Edit</button>
                      <button type="button" className="danger-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="7">No vendor products yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}




