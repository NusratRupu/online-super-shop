import { useEffect, useMemo, useState } from "react";
import api from "./api/client";

export default function SellerEarningsPanel({ title = "My Earnings" }) {
  const [wallet, setWallet] = useState(null);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  async function loadEarnings() {
    try {
      const response = await api.get("/sales-records/mine");
      setWallet(response.data.wallet || {});
      setRecords(response.data.records || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "No earnings yet.");
    }
  }

  useEffect(() => {
    loadEarnings();
  }, []);

  const totals = useMemo(() => ({
    points: Number(wallet?.points || 0),
    sales: Number(wallet?.total_sales_amount || 0),
    commission: Number(wallet?.total_commission_amount || 0),
    net: Number(wallet?.total_net_amount || 0),
  }), [wallet]);

  return (
    <section className="vendor-card">
      <div className="admin-section-title-row">
        <div>
          <h2>{title}</h2>
          <p>Points are demo earnings. Later these can be converted to real withdrawal/payment requests.</p>
        </div>
      </div>

      {message && records.length === 0 && <div className="admin-message">{message}</div>}

      <div className="vendor-stats compact-stats">
        <div><strong>{totals.points}</strong><span>Seller Points</span></div>
        <div><strong>BDT {totals.sales.toFixed(0)}</strong><span>Total Sales</span></div>
        <div><strong>BDT {totals.commission.toFixed(0)}</strong><span>Platform Commission</span></div>
        <div><strong>BDT {totals.net.toFixed(0)}</strong><span>Net Earnings</span></div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Gross</th>
              <th>Commission</th>
              <th>Net / Points</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td><strong>{record.order_number}</strong></td>
                <td>{record.product_name}</td>
                <td>{record.quantity}</td>
                <td>BDT {Number(record.gross_amount).toFixed(0)}</td>
                <td>BDT {Number(record.commission_amount).toFixed(0)}</td>
                <td>{Number(record.points_awarded)} pts</td>
                <td>{record.settlement_status}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan="7">No sale records yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
