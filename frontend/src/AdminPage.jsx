import { useEffect, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";
import AdminOrdersPanel from "./AdminOrdersPanel.jsx";
import AdminUsersPanel from "./AdminUsersPanel.jsx";

const emptyProductForm = {
  id: null,
  seller_id: "",
  category_id: "",
  name: "",
  description: "",
  product_type: "super_shop",
  product_condition: "new",
  price: "",
  old_price: "",
  stock: "0",
  unit: "pcs",
  image_url: "",
  approval_status: "approved",
  is_featured: false,
  is_active: true,
};

const emptyCategoryForm = {
  id: null,
  name: "",
  image_url: "",
  is_active: true,
};

export default function AdminPage({ onLogout }) {
  const [activePanel, setActivePanel] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [productRes, categoryRes] = await Promise.all([
        api.get("/admin/products"),
        api.get("/admin/categories"),
      ]);

      setProducts(productRes.data.products || []);
      setCategories(categoryRes.data.categories || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateCategoryField(field, value) {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file, target) {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/upload/product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (target === "category") {
        updateCategoryField("image_url", response.data.image_url);
      } else {
        updateProductField("image_url", response.data.image_url);
      }

      setMessage("Image uploaded successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function startEditProduct(product) {
    setProductForm({
      id: product.id,
      seller_id: product.seller_id || "",
      category_id: product.category_id || "",
      name: product.name || "",
      description: product.description || "",
      product_type: product.product_type || "super_shop",
      product_condition: product.product_condition || "new",
      price: product.price || "",
      old_price: product.old_price || "",
      stock: product.stock ?? "0",
      unit: product.unit || "pcs",
      image_url: product.image_url || "",
      approval_status: product.approval_status || "approved",
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),
    });

    setActivePanel("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditCategory(category) {
    setCategoryForm({
      id: category.id,
      name: category.name || "",
      image_url: category.image_url || "",
      is_active: Boolean(category.is_active),
    });

    setActivePanel("categories");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (!productForm.name || productForm.price === "") {
      setMessage("Product name and price are required.");
      return;
    }

    try {
      const payload = {
        ...productForm,
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        seller_id: productForm.seller_id ? Number(productForm.seller_id) : null,
        price: Number(productForm.price),
        old_price: productForm.old_price !== "" ? Number(productForm.old_price) : null,
        stock: Number(productForm.stock || 0),
      };

      if (productForm.id) {
        await api.put(`/admin/products/${productForm.id}`, payload);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/admin/products", payload);
        setMessage("Product added successfully.");
      }

      setProductForm(emptyProductForm);
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save product.");
    }
  }

  async function saveCategory(event) {
    event.preventDefault();

    if (!categoryForm.name) {
      setMessage("Category name is required.");
      return;
    }

    try {
      const payload = {
        name: categoryForm.name,
        image_url: categoryForm.image_url,
        is_active: categoryForm.is_active,
      };

      if (categoryForm.id) {
        await api.put(`/admin/categories/${categoryForm.id}`, payload);
        setMessage("Category updated successfully.");
      } else {
        await api.post("/admin/categories", payload);
        setMessage("Category added successfully.");
      }

      setCategoryForm(emptyCategoryForm);
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save category.");
    }
  }

  async function disableProduct(productId) {
    if (!window.confirm("Disable this product?")) return;
    await api.patch(`/admin/products/${productId}/disable`);
    setMessage("Product disabled successfully.");
    await loadAdminData();
  }

  async function deleteProduct(productId) {
    if (!window.confirm("Permanently delete this product?")) return;
    await api.delete(`/admin/products/${productId}`);
    setMessage("Product permanently deleted successfully.");
    await loadAdminData();
  }

  async function disableCategory(categoryId) {
    if (!window.confirm("Disable this category?")) return;
    await api.patch(`/admin/categories/${categoryId}/disable`);
    setMessage("Category disabled successfully.");
    await loadAdminData();
  }

  async function deleteCategory(categoryId) {
    if (!window.confirm("Delete this category? Products under this category will become uncategorized.")) return;
    await api.delete(`/admin/categories/${categoryId}`);
    setMessage("Category deleted successfully.");
    await loadAdminData();
  }

  const activeCategories = categories.filter((item) => item.is_active);
  const totalProducts = products.length;
  const activeProducts = products.filter((item) => item.is_active).length;
  const lowStockProducts = products.filter((item) => Number(item.stock) <= 5).length;
  const resaleProducts = products.filter((item) => item.product_type === "resale").length;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>NityoMart BD Admin Panel</h1>
          <p>Manage products, categories, images, stock, and product status.</p>
        </div>
        <div className="admin-header-actions">
          <a href="/">Back to Website</a>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <section className="admin-stats">
        <div><strong>{totalProducts}</strong><span>Total Products</span></div>
        <div><strong>{activeProducts}</strong><span>Active Products</span></div>
        <div><strong>{lowStockProducts}</strong><span>Low / Out Stock</span></div>
        <div><strong>{resaleProducts}</strong><span>Resale Items</span></div>
      </section>

      <div className="admin-tabs">
        <button className={activePanel === "products" ? "active" : ""} onClick={() => setActivePanel("products")}>
          Products
        </button>
        <button className={activePanel === "categories" ? "active" : ""} onClick={() => setActivePanel("categories")}>
          Categories
        </button>
        <button className={activePanel === "orders" ? "active" : ""} onClick={() => setActivePanel("orders")}>
          Orders
        </button>
        <button className={activePanel === "users" ? "active" : ""} onClick={() => setActivePanel("users")}>
          Users / Vendors
        </button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      {activePanel === "products" && (
        <>
          <section className="admin-card">
            <h2>{productForm.id ? "Edit Product" : "Add New Product"}</h2>

            <form className="admin-form" onSubmit={saveProduct}>
              <input placeholder="Product Name *" value={productForm.name} onChange={(e) => updateProductField("name", e.target.value)} />

              <select value={productForm.category_id} onChange={(e) => updateProductField("category_id", e.target.value)}>
                <option value="">Select Category</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <select value={productForm.product_type} onChange={(e) => updateProductField("product_type", e.target.value)}>
                <option value="super_shop">Super Shop</option>
                <option value="resale">Resale</option>
              </select>

              <select value={productForm.product_condition} onChange={(e) => updateProductField("product_condition", e.target.value)}>
                <option value="new">New</option>
                <option value="used_like_new">Used - Like New</option>
                <option value="used_good">Used - Good</option>
                <option value="used_fair">Used - Fair</option>
              </select>

              <input type="number" placeholder="Price *" value={productForm.price} onChange={(e) => updateProductField("price", e.target.value)} />
              <input type="number" placeholder="Old Price" value={productForm.old_price} onChange={(e) => updateProductField("old_price", e.target.value)} />
              <input type="number" placeholder="Stock Quantity, use 0 for Out of Stock" value={productForm.stock} onChange={(e) => updateProductField("stock", e.target.value)} />
              <input placeholder="Unit, e.g. kg, pcs, bottle" value={productForm.unit} onChange={(e) => updateProductField("unit", e.target.value)} />

              <input placeholder="Seller ID optional: blank = NityoMart BD" value={productForm.seller_id} onChange={(e) => updateProductField("seller_id", e.target.value)} />

              <div className="wide upload-box">
                <label>Upload Product Image</label>
                <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], "product")} />
                {uploading && <small>Uploading image...</small>}
              </div>

              <input className="wide" placeholder="Or paste direct image URL" value={productForm.image_url} onChange={(e) => updateProductField("image_url", e.target.value)} />

              {productForm.image_url && (
                <div className="wide image-preview-box">
                  <img src={getImageUrl(productForm.image_url)} alt="Preview" />
                  <small>{productForm.image_url}</small>
                </div>
              )}

              <textarea className="wide" placeholder="Product Description" value={productForm.description} onChange={(e) => updateProductField("description", e.target.value)} />

              <select value={productForm.approval_status} onChange={(e) => updateProductField("approval_status", e.target.value)}>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <label className="check-row">
                <input type="checkbox" checked={productForm.is_featured} onChange={(e) => updateProductField("is_featured", e.target.checked)} />
                Featured Product
              </label>

              <label className="check-row">
                <input type="checkbox" checked={productForm.is_active} onChange={(e) => updateProductField("is_active", e.target.checked)} />
                Active Product
              </label>

              <div className="admin-actions">
                <button type="submit">{productForm.id ? "Update Product" : "Add Product"}</button>
                <button type="button" className="secondary-btn" onClick={() => setProductForm(emptyProductForm)}>Clear</button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <h2>Product List</h2>

            {loading ? (
              <p>Loading products...</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Seller</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td><img className="admin-thumb" src={getImageUrl(product.image_url)} alt={product.name} /></td>
                        <td><strong>{product.name}</strong><small>{product.category_name || "No Category"}</small></td>
                        <td>{product.product_type}</td>
                        <td>BDT {Number(product.price).toFixed(0)}</td>
                        <td className={Number(product.stock) <= 5 ? "low-stock-cell" : ""}>{product.stock} {product.unit}</td>
                        <td>{product.vendor_shop_name || "NityoMart BD"}</td>
                        <td>{product.is_active ? "Active" : "Disabled"}</td>
                        <td>
                          <button type="button" onClick={() => startEditProduct(product)}>Edit</button>
                          <button type="button" className="danger-btn" onClick={() => disableProduct(product.id)}>Disable</button>
                          <button type="button" className="danger-btn hard-delete" onClick={() => deleteProduct(product.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activePanel === "orders" && <AdminOrdersPanel />}

      {activePanel === "users" && <AdminUsersPanel />}

      {activePanel === "categories" && (
        <>
          <section className="admin-card">
            <h2>{categoryForm.id ? "Edit Category" : "Add New Category"}</h2>

            <form className="admin-form" onSubmit={saveCategory}>
              <input placeholder="Category Name *" value={categoryForm.name} onChange={(e) => updateCategoryField("name", e.target.value)} />

              <div className="wide upload-box">
                <label>Upload Category Image</label>
                <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], "category")} />
              </div>

              <input className="wide" placeholder="Or paste direct category image URL" value={categoryForm.image_url} onChange={(e) => updateCategoryField("image_url", e.target.value)} />

              {categoryForm.image_url && (
                <div className="wide image-preview-box">
                  <img src={getImageUrl(categoryForm.image_url)} alt="Category Preview" />
                  <small>{categoryForm.image_url}</small>
                </div>
              )}

              <label className="check-row">
                <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => updateCategoryField("is_active", e.target.checked)} />
                Active Category
              </label>

              <div className="admin-actions">
                <button type="submit">{categoryForm.id ? "Update Category" : "Add Category"}</button>
                <button type="button" className="secondary-btn" onClick={() => setCategoryForm(emptyCategoryForm)}>Clear</button>
              </div>
            </form>
          </section>

          <section className="admin-card">
            <h2>Category List</h2>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td><img className="admin-thumb" src={getImageUrl(category.image_url)} alt={category.name} /></td>
                      <td><strong>{category.name}</strong><small>{category.slug}</small></td>
                      <td>{category.product_count}</td>
                      <td>{category.is_active ? "Active" : "Disabled"}</td>
                      <td>
                        <button type="button" onClick={() => startEditCategory(category)}>Edit</button>
                        <button type="button" className="danger-btn" onClick={() => disableCategory(category.id)}>Disable</button>
                        <button type="button" className="danger-btn hard-delete" onClick={() => deleteCategory(category.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}



