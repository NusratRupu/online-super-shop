import { useEffect, useState } from "react";
import api from "./api/client";

export default function DeliverymanEarningsPanel() {
  const [wallet, setWallet] = useState({});
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get("/deliveryman/earnings").then((res) => {
      setWallet(res.data.wallet || {});
      setRecords(res.data.records || []);
    });
  }, []);

  return (
    <section className="vendor-card">
      <h2>Deliveryman Earnings & Records</h2>
      <p>Points are approved by admin after deliveryman delivery confirmation and customer received confirmation.</p>

      <div className="vendor-stats compact-stats">
        <div><strong>{Number(wallet.points || 0)}</strong><span>Total Points</span></div>
        <div><strong>{records.length}</strong><span>Delivery Records</span></div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Delivery Status</th>
              <th>Customer Received</th>
              <th>Payout</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item, index) => (
              <tr key={index}>
                <td>{item.order_number}</td>
                <td>{String(item.delivery_status || "").replaceAll("_", " ")}</td>
                <td>{item.customer_received ? "Confirmed" : "Not Yet"}</td>
                <td>{item.delivery_payout_status}</td>
                <td>{Number(item.delivery_points || 0)}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan="5">No delivery earnings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
