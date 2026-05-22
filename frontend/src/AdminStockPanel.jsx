import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";

export default function AdminStockPanel() {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadStock() {
    try {
      const response = await api.get("/admin/stock");
      const items = response.data.products || [];
      setProducts(items);

      const nextDrafts = {};
      items.forEach((product) => {
        nextDrafts[product.id] = {
          stock: product.stock,
          unit: product.unit,
        };
      });
      setDrafts(nextDrafts);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load stock list.");
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      const text = `${product.name} ${product.category_name} ${product.vendor_shop_name || product.seller_name || "NityoMart BD"}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [products, search]);

  const summary = useMemo(() => {
    return {
      total: products.length,
      out: products.filter((product) => Number(product.stock) <= 0).length,
      low: products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5).length,
    };
  }, [products]);

  function updateDraft(productId, field, value) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }));
  }

  async function saveStock(productId) {
    try {
      const draft = drafts[productId];

      await api.patch(`/admin/stock/${productId}`, {
        stock: draft.stock,
        unit: draft.unit,
      });

      setMessage("Stock updated successfully.");
      await loadStock();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update stock.");
    }
  }

  async function markOutOfStock(productId) {
    if (!confirm("Mark this product as out of stock?")) return;

    try {
      await api.patch(`/admin/stock/${productId}/out-of-stock`);
      setMessage("Product marked as out of stock.");
      await loadStock();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to mark out of stock.");
    }
  }

  function stockBadge(product) {
    const stock = Number(product.stock);

    if (stock <= 0) return <span className="stock-admin-badge out">Out of Stock</span>;
    if (stock <= 5) return <span className="stock-admin-badge low">Low Stock</span>;
    return <span className="stock-admin-badge ok">In Stock</span>;
  }

  return (
    <section className="admin-card">
      <h2>Stock Management</h2>
      <p>Update inventory, mark products out of stock, and monitor low-stock products.</p>

      {message && <div className="admin-message">{message}</div>}

      <div className="stock-summary-row">
        <div><strong>{summary.total}</strong><span>Total Products</span></div>
        <div><strong>{summary.low}</strong><span>Low Stock</span></div>
        <div><strong>{summary.out}</strong><span>Out of Stock</span></div>
      </div>

      <input
        className="admin-search-input"
        placeholder="Search product, category, or seller..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Seller</th>
              <th>Current</th>
              <th>Status</th>
              <th>Update Stock</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <img className="admin-thumb" src={getImageUrl(product.image_url)} alt={product.name} />
                </td>

                <td>
                  <strong>{product.name}</strong>
                  <small>{product.category_name}</small>
                  <small>{product.product_type === "resale" ? "Resale / Used" : "New Product"}</small>
                </td>

                <td>{product.vendor_shop_name || product.seller_name || "NityoMart BD"}</td>

                <td>
                  <strong>{product.stock} {product.unit}</strong>
                </td>

                <td>{stockBadge(product)}</td>

                <td>
                  <div className="stock-edit-row">
                    <input
                      type="number"
                      min="0"
                      value={drafts[product.id]?.stock ?? product.stock}
                      onChange={(event) => updateDraft(product.id, "stock", event.target.value)}
                    />
                    <input
                      value={drafts[product.id]?.unit ?? product.unit}
                      onChange={(event) => updateDraft(product.id, "unit", event.target.value)}
                    />
                  </div>
                </td>

                <td>
                  <div className="user-action-row">
                    <button onClick={() => saveStock(product.id)}>Save</button>
                    <button className="danger-btn" onClick={() => markOutOfStock(product.id)}>
                      Out of Stock
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
