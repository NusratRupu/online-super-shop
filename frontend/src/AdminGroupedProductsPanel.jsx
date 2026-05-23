import { useMemo, useState } from "react";
import { getImageUrl } from "./utils/imageUrl";

export default function AdminGroupedProductsPanel({
  products,
  onEdit,
  onDisable,
  onEnable,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const approvedProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return (products || [])
      .filter((product) => (product.approval_status || "approved") === "approved")
      .filter((product) => selectedCategory === "all" || (product.product_type === "resale" ? "Resale Items" : product.category_name || "Uncategorized") === selectedCategory)
      .filter((product) => {
        const text = `${product.name || ""} ${product.category_name || ""} ${product.product_type || ""} ${product.vendor_shop_name || product.seller_name || "NityoMart BD"}`.toLowerCase();
        return !query || text.includes(query);
      });
  }, [products, search, selectedCategory]);

  const categoryNames = useMemo(() => {
    return Array.from(
      new Set(
        (products || [])
          .filter((product) => (product.approval_status || "approved") === "approved")
          .map((product) => product.product_type === "resale" ? "Resale Items" : product.category_name || "Uncategorized")
      )
    ).sort();
  }, [products]);

  const groupedProducts = useMemo(() => {
    return approvedProducts.reduce((groups, product) => {
      const category = product.product_type === "resale" ? "Resale Items" : product.category_name || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(product);
      return groups;
    }, {});
  }, [approvedProducts]);

  const visibleCategoryNames = Object.keys(groupedProducts).sort();

  return (
    <section className="admin-card">
      <div className="admin-section-title-row">
        <div>
          <h2>Product List</h2>
          <p>Browse approved products by category. Pending vendor/customer ads are handled in Product Approvals.</p>
        </div>

        <input
          className="admin-product-search"
          placeholder="Search products, category, type, seller..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="admin-category-filter-row">
        <button
          type="button"
          className={selectedCategory === "all" ? "active" : ""}
          onClick={() => setSelectedCategory("all")}
        >
          All Products
        </button>

        {categoryNames.map((categoryName) => (
          <button
            type="button"
            key={categoryName}
            className={selectedCategory === categoryName ? "active" : ""}
            onClick={() => setSelectedCategory(categoryName)}
          >
            {categoryName}
          </button>
        ))}
      </div>

      {visibleCategoryNames.length === 0 ? (
        <p>No approved products found.</p>
      ) : (
        visibleCategoryNames.map((categoryName) => (
          <div className="admin-category-product-group" key={categoryName}>
            <div className="admin-category-group-title">
              <h3>{categoryName}</h3>
              <span>{groupedProducts[categoryName].length} product(s)</span>
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
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {groupedProducts[categoryName].map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img className="admin-thumb" src={getImageUrl(product.image_url)} alt={product.name} />
                      </td>

                      <td>
                        <strong>{product.name}</strong>
                        <small>{product.description || ""}</small>
                      </td>

                      <td>{product.product_type === "resale" ? "Resale / Used" : "Super Shop"}</td>
                      <td>BDT {Number(product.price || 0).toFixed(0)}</td>

                      <td className={Number(product.stock) <= 3 ? "low-stock-cell" : ""}>
                        {product.stock} {product.unit}
                      </td>

                      <td>{product.vendor_shop_name || product.seller_name || "NityoMart BD"}</td>
                      <td>{product.is_active ? "Active" : "Disabled"}</td>

                      <td>
                        <div className="user-action-row">
                          <button type="button" onClick={() => onEdit(product)}>Edit</button>

                          {product.is_active ? (
                            <button type="button" className="danger-btn" onClick={() => onDisable(product.id)}>
                              Disable
                            </button>
                          ) : (
                            <button type="button" className="approve-btn" onClick={() => onEnable(product.id)}>
                              Enable
                            </button>
                          )}

                          <button type="button" className="danger-btn hard-delete" onClick={() => onDelete(product.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

