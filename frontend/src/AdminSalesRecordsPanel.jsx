import { useEffect, useState } from "react";
import api from "./api/client";

export default function AdminSalesRecordsPanel() {
  const [summary, setSummary] = useState({});
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  async function loadRecords() {
    try {
      const response = await api.get("/sales-records/admin");
      setSummary(response.data.summary || {});
      setRecords(response.data.records || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load sales records.");
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <section className="admin-card">
      <div className="admin-section-title-row">
        <div>
          <h2>All Sale Records</h2>
          <p>Admin view of vendor/customer resale earnings, platform commission, and settlement history.</p>
        </div>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="vendor-stats compact-stats">
        <div><strong>{Number(summary.total_records || 0)}</strong><span>Sale Records</span></div>
        <div><strong>BDT {Number(summary.total_sales || 0).toFixed(0)}</strong><span>Total Sales</span></div>
        <div><strong>BDT {Number(summary.platform_commission || 0).toFixed(0)}</strong><span>Admin Commission</span></div>
        <div><strong>BDT {Number(summary.seller_payable || 0).toFixed(0)}</strong><span>Seller Earnings</span></div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Seller</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Gross</th>
              <th>Commission</th>
              <th>Seller Net</th>
              <th>Points</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.order_number}</strong>
                  <small>{new Date(record.order_date).toLocaleString()}</small>
                </td>
                <td>
                  <strong>{record.seller_name}</strong>
                  <small>{record.seller_role}</small>
                  <small>{record.seller_email}</small>
                </td>
                <td>{record.product_name}</td>
                <td>{record.quantity}</td>
                <td>BDT {Number(record.gross_amount).toFixed(0)}</td>
                <td>BDT {Number(record.commission_amount).toFixed(0)}</td>
                <td>BDT {Number(record.seller_net_amount).toFixed(0)}</td>
                <td>{Number(record.points_awarded)} pts</td>
                <td>{record.settlement_status}</td>
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td colSpan="9">No sale records yet. Complete delivery → customer confirmation → admin payout approval first.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
