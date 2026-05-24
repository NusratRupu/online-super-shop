import { useEffect, useState } from "react";
import api from "./api/client";

const roleTabs = [
  { key: "all", label: "All Users" },
  { key: "customer", label: "Customers" },
  { key: "vendor", label: "Vendors" },
  { key: "deliveryman", label: "Deliverymen" },
  { key: "admin", label: "Admins" },
];

const roleGroups = [
  { key: "customer", title: "Customer Users" },
  { key: "vendor", title: "Vendor Users" },
  { key: "deliveryman", title: "Deliverymen" },
  { key: "admin", title: "Admin Users" },
];

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
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

  const searchedUsers = users.filter((user) => {
    const keyword = userSearch.trim().toLowerCase();

    const searchText = [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.shop_name,
      user.shop_phone,
      user.shop_address,
      user.status,
      user.vendor_approval_status,
      user.approval_status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return !keyword || searchText.includes(keyword);
  });

  const visibleGroups =
    userRoleFilter === "all"
      ? roleGroups
      : roleGroups.filter((group) => group.key === userRoleFilter);

  function renderUserRow(user) {
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
  }

  function renderUserTable(group) {
    const groupUsers = searchedUsers.filter((user) => user.role === group.key);

    return (
      <section className="user-role-section" key={group.key}>
        <div className="user-role-section-head">
          <h3>{group.title}</h3>
          <span>{groupUsers.length} user(s)</span>
        </div>

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
              {groupUsers.map(renderUserRow)}
              {groupUsers.length === 0 && (
                <tr>
                  <td colSpan="6">No {group.title.toLowerCase()} found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-card">
      <h2>Users</h2>
      <p className="admin-subtitle">
        Manage customers, vendors, deliverymen, admins, account status, and approvals.
      </p>

      {message && <div className="admin-message">{message}</div>}

      <div className="user-filter-toolbar">
        <div className="user-filter-tabs">
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={userRoleFilter === tab.key ? "active" : ""}
              onClick={() => setUserRoleFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          className="user-search-input"
          type="search"
          placeholder="Search users by name, email, phone, role, or shop..."
          value={userSearch}
          onChange={(event) => setUserSearch(event.target.value)}
        />
      </div>

      {loading ? <p>Loading users...</p> : visibleGroups.map(renderUserTable)}
    </section>
  );
}
