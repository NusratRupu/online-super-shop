import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import { getImageUrl } from "./utils/imageUrl";

export default function AdminProductApprovalsPanel() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");

  async function loadProducts() {
    try {
      const response = await api.get("/admin/products");
      setProducts(response.data.products || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load product approvals.");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const reviewProducts = useMemo(() => {
    return products.filter((product) => {
      const approval = product.approval_status || "pending";

      // Pending/rejected must always appear here, even if seller field names differ.
      if (filter === "pending") return approval === "pending";
      if (filter === "rejected") return approval === "rejected";

      // Approved/all should focus on submitted products, not every NityoMart admin product.
      const sellerText = `${product.seller_id || ""} ${product.vendor_shop_name || ""} ${product.seller_name || ""}`.toLowerCase();
      const isSubmitted = Boolean(product.seller_id || product.vendor_shop_name) || !sellerText.includes("nityomart");

      if (filter === "approved") return approval === "approved" && isSubmitted;
      if (filter === "all") return isSubmitted || approval !== "approved";

      return false;
    });
  }, [products, filter]);

  async function updateApproval(productId, approvalStatus) {
    try {
      await api.patch(`/admin/product-approval/${productId}/approval`, {
        approval_status: approvalStatus,
      });

      setMessage(
        approvalStatus === "approved"
          ? "Product approved and activated successfully."
          : `Product ${approvalStatus} and hidden from shop.`
      );

      await loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update product approval.");
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-section-title-row">
        <div>
          <h2>Product Approvals</h2>
          <p>Approve vendor/customer submitted product ads before they become active and visible in the shop.</p>
        </div>

        <select
          className="admin-product-search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="pending">Pending Only</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All Submitted Products</option>
        </select>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Seller</th>
              <th>Type</th>
              <th>Price</th>
              <th>Active Status</th>
              <th>Approval</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {reviewProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <img className="admin-thumb" src={getImageUrl(product.image_url)} alt={product.name} />
                </td>

                <td>
                  <strong>{product.name}</strong>
                  <small>{product.category_name || "Uncategorized"}</small>
                </td>

                <td>{product.vendor_shop_name || product.seller_name || "Vendor/Customer"}</td>
                <td>{product.product_type === "resale" ? "Resale / Used" : "Vendor Product"}</td>
                <td>BDT {Number(product.price || 0).toFixed(0)}</td>
                <td>{product.is_active ? "Active" : "Inactive"}</td>

                <td>
                  <span className={`product-approval-badge ${product.approval_status || "pending"}`}>
                    {product.approval_status || "pending"}
                  </span>
                </td>

                <td>
                  <div className="user-action-row">
                    {product.approval_status !== "approved" && (
                      <button className="approve-btn" onClick={() => updateApproval(product.id, "approved")}>
                        Approve Product
                      </button>
                    )}

                    {product.approval_status !== "rejected" && (
                      <button className="reject-btn" onClick={() => updateApproval(product.id, "rejected")}>
                        Reject Product
                      </button>
                    )}

                    {product.approval_status !== "pending" && (
                      <button className="secondary-btn" onClick={() => updateApproval(product.id, "pending")}>
                        Mark Pending
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {reviewProducts.length === 0 && (
              <tr>
                <td colSpan="8">No products found for this approval filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
