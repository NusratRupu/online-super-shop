import { useEffect, useMemo, useState } from "react";
import api from "./api/client";

export default function AdminStockPanel({ products: incomingProducts, onStockChanged }) {
  const products = useMemo(() => {
    return Array.isArray(incomingProducts) ? incomingProducts : [];
  }, [incomingProducts]);

  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextDrafts = {};
    products.forEach((product) => {
      nextDrafts[product.id] = {
        stock: product.stock ?? 0,
        unit: product.unit || "pcs",
      };
    });
    setDrafts(nextDrafts);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      const text = `${product.name || ""} ${product.category_name || ""} ${product.product_type || ""} ${product.vendor_shop_name || product.seller_name || "NityoMart BD"}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [products, search]);

  const summary = {
    total: products.length,
    low: products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 3).length,
    out: products.filter((product) => Number(product.stock) <= 0).length,
  };

  function updateDraft(productId, field, value) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] || {}),
        [field]: value,
      },
    }));
  }

  async function refreshParent() {
    if (onStockChanged) {
      await onStockChanged();
    }
  }

  async function saveStock(productId) {
    try {
      const draft = drafts[productId] || {};
      await api.patch(`/admin/stock/${productId}`, {
        stock: Number(draft.stock || 0),
        unit: draft.unit || "pcs",
      });

      setMessage("Stock updated successfully.");
      await refreshParent();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Failed to update stock.");
    }
  }

  async function markOutOfStock(productId) {
    try {
      await api.patch(`/admin/stock/${productId}/out-of-stock`);
      setMessage("Product marked as out of stock.");
      await refreshParent();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Failed to mark out of stock.");
    }
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
        placeholder="Search product, category, type, or seller..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Current</th>
              <th>Status</th>
              <th>Update Stock</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => {
              const stock = Number(product.stock || 0);

              return (
                <tr key={product.id} id={`stock-product-${product.id}`}>
                  <td>
                    <strong>{product.name}</strong>
                    <small>{product.category_name || "Uncategorized"}</small>
                    <small>{product.product_type === "resale" ? "Resale / Used" : "New Product"}</small>
                  </td>

                  <td>{product.vendor_shop_name || product.seller_name || "NityoMart BD"}</td>
                  <td><strong>{stock} {product.unit || "pcs"}</strong></td>

                  <td>
                    <span className={`stock-admin-badge ${stock <= 0 ? "out" : stock <= 3 ? "low" : "ok"}`}>
                      {stock <= 0 ? "Out of Stock" : stock <= 3 ? "Low Stock" : "In Stock"}
                    </span>
                  </td>

                  <td>
                    <div className="stock-edit-row">
                      <input
                        type="number"
                        min="0"
                        value={drafts[product.id]?.stock ?? stock}
                        onChange={(event) => updateDraft(product.id, "stock", event.target.value)}
                      />
                      <input
                        value={drafts[product.id]?.unit ?? product.unit ?? "pcs"}
                        onChange={(event) => updateDraft(product.id, "unit", event.target.value)}
                      />
                    </div>
                  </td>

                  <td>
                    <div className="user-action-row">
                      <button type="button" onClick={() => saveStock(product.id)}>Save</button>
                      <button type="button" className="danger-btn" onClick={() => markOutOfStock(product.id)}>
                        Out of Stock
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
