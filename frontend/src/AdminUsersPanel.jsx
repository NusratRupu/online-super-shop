import { useEffect, useState } from "react";
import api from "./api/client";

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await api.get("/admin/users");
      setUsers(response.data.users || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(userId, payload) {
    try {
      await api.patch(`/admin/users/${userId}/status`, payload);
      setMessage("User status updated successfully.");
      await loadUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update user.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Users, Customers & Vendors</h2>
      <p className="admin-subtitle">
        Manage customer accounts, vendor approvals, blocked users, and access status.
      </p>

      {message && <div className="admin-message">{message}</div>}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Shop Info</th>
                <th>Status</th>
                <th>Vendor Approval</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isVendor = user.role === "vendor";
                const isAdmin = user.role === "admin";
                const isBlocked = user.status === "blocked" || user.status === "inactive";
                const needsApproval = isVendor && user.approval_status !== "approved";

                return (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                      <small>{user.phone || "N/A"}</small>
                    </td>

                    <td>{user.role}</td>

                    <td>
                      {isVendor ? (
                        <>
                          <strong>{user.shop_name || "N/A"}</strong>
                          <small>{user.shop_phone || "N/A"}</small>
                          <small>{user.shop_address || "N/A"}</small>
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      <span className={`user-status ${user.status}`}>
                        {user.status}
                      </span>
                    </td>

                    <td>
                      {isVendor ? (
                        <span className={`user-status ${user.approval_status || "pending"}`}>
                          {user.approval_status || "pending"}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td>
                      {isAdmin ? (
                        <span className="protected-admin">Protected Admin</span>
                      ) : (
                        <div className="user-action-row">
                          {needsApproval && (
                            <button
                              type="button"
                              onClick={() =>
                                updateUser(user.id, {
                                  status: "active",
                                  approval_status: "approved",
                                })
                              }
                            >
                              Approve
                            </button>
                          )}

                          {isBlocked ? (
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => updateUser(user.id, { status: "active" })}
                            >
                              Unlock
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => updateUser(user.id, { status: "blocked" })}
                            >
                              Block
                            </button>
                          )}

                          {isVendor && user.approval_status !== "rejected" && (
                            <button
                              type="button"
                              className="danger-btn hard-delete"
                              onClick={() =>
                                updateUser(user.id, {
                                  status: "blocked",
                                  approval_status: "rejected",
                                })
                              }
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
