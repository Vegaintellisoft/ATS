import { useEffect, useState } from "react";
import { toast } from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import { type User, type Role } from "../types";
import { PageHeader } from "../components/layout/PageHeader";
import { listRoles } from "../api/role";
import { listUsers, createUser, updateUser, deleteUser } from "../api/user";

export function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const canCreate = hasPermission("user:create");
  const canUpdate = hasPermission("user:update");
  const canDelete = hasPermission("user:delete");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [reportingPersonId, setReportingPersonId] = useState("");
  const [role, setRole] = useState("TEAM_MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        listUsers(),
        canCreate || canUpdate ? listRoles(currentUser?.organizationId || undefined) : Promise.resolve([])
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setEmployeeCode("");
    setDepartment("");
    setReportingPersonId("");
    setRole("TEAM_MEMBER");
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setName(u.name || "");
    setEmail(u.email || "");
    setPassword("");
    setConfirmPassword("");
    setPhone(u.phone || u.contactNumber || "");
    setEmployeeCode(u.employeeCode || "");
    setDepartment(u.department || "");
    setReportingPersonId(u.reportingPersonId || "");
    setRole(u.role?.name || "TEAM_MEMBER");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId) {
      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    } else if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateUser(editingId, {
          email: email.trim(),
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          employeeCode: employeeCode.trim() || undefined,
          department: department.trim() || undefined,
          reportingPersonId: reportingPersonId || null,
          role,
        });
        toast.success(`User "${email.trim()}" updated successfully!`);
      } else {
        await createUser({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          employeeCode: employeeCode.trim() || undefined,
          department: department.trim() || undefined,
          reportingPersonId: reportingPersonId || undefined,
          role,
        });
        toast.success(`User "${email.trim()}" created successfully!`);
      }
      resetForm();
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${editingId ? "update" : "create"} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await updateUser(userId, { status } as any);
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: status as any } : u)));
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      toast.success("User removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
    }
  };

  const isFormValid =
    email.trim() &&
    role.trim() &&
    (editingId || (password.trim() && password.length >= 6 && password === confirmPassword));

  return (
    <>
      <PageHeader
        icon="👥"
        title="Users Directory"
        description="View and manage corporate users, roles, and reporting hierarchies."
      >
        {canCreate && (
          <button
            className="search-btn"
            style={{ padding: "10px 24px", fontSize: "0.9rem" }}
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
          >
            {showForm ? "✕ Cancel" : "➕ Create User"}
          </button>
        )}
      </PageHeader>

      <div className="page-body">
        {/* Inline Create/Edit User Form */}
        {showForm && (
          <div
            className="glass-card"
            style={{
              padding: "2rem",
              borderRadius: "16px",
              marginBottom: "2rem",
              border: "1px solid rgba(79,70,229,0.3)",
              animation: "slideUp 0.2s ease",
            }}
          >
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
              {editingId ? "✏️ Edit User Details" : "➕ Create New User"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Email (full width) */}
                <div className="create-user-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Email Address <span style={{ color: "var(--accent)" }}>*</span></label>
                  <input
                    type="email"
                    className="login-input"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Password */}
                {!editingId && (
                  <>
                    <div className="create-user-field">
                      <label>Password <span style={{ color: "var(--accent)" }}>*</span></label>
                      <input
                        type="password"
                        className="login-input"
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                        minLength={6}
                        style={{ width: "100%", height: "44px", padding: "0 16px" }}
                      />
                    </div>

                    <div className="create-user-field">
                      <label>Confirm Password <span style={{ color: "var(--accent)" }}>*</span></label>
                      <input
                        type="password"
                        className="login-input"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                        style={{ width: "100%", height: "44px", padding: "0 16px" }}
                      />
                    </div>
                  </>
                )}

                {/* Full Name */}
                <div className="create-user-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Employee Code */}
                <div className="create-user-field">
                  <label>Employee Code</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="EMP-1001"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Phone */}
                <div className="create-user-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    className="login-input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Department */}
                <div className="create-user-field">
                  <label>Department</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="e.g. Sales, HR"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Role */}
                <div className="create-user-field">
                  <label>Role</label>
                  <select
                    className="login-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Reporting To */}
                <div className="create-user-field">
                  <label>Reporting To</label>
                  <select
                    className="login-input login-select"
                    value={reportingPersonId}
                    onChange={(e) => setReportingPersonId(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  >
                    <option value="">None (Top Level)</option>
                    {users
                      .filter((u) => u.id !== editingId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email} ({u.role?.name})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Submit & Cancel */}
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="search-btn"
                    disabled={isSubmitting || !isFormValid}
                    style={{ minWidth: "140px" }}
                  >
                    {isSubmitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "✓ Save User" : "✓ Create User")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="status-indicator processing">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👥</span>
            <h3>No users found</h3>
            <p>Click <strong>➕ Create User</strong> above to add your first user.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact</th>
                  <th>Role &amp; Dept</th>
                  <th>Reporting To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-heading">{u.name || "N/A"}</div>
                      <div className="text-muted text-sm">{u.employeeCode || "-"}</div>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      <div className="text-muted text-sm">{u.phone || u.contactNumber || "-"}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{u.role?.name?.replace(/_/g, " ")}</span>
                      <div className="text-muted text-sm mt-1">{u.department || "-"}</div>
                    </td>
                    <td>{u.reportingPerson?.name || u.reportingPerson?.email || "-"}</td>
                    <td>
                      <select
                        className="login-input"
                        style={{ padding: "4px 8px", height: "34px", width: "auto", fontSize: "0.82rem" }}
                        value={u.status || "ACTIVE"}
                        onChange={(e) => handleStatusChange(u.id, e.target.value)}
                        disabled={!canUpdate}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          className="search-btn"
                          style={{ padding: "4px 10px", height: "32px", fontSize: "0.8rem", background: "rgba(255,255,255,0.1)" }}
                          title="Edit user details"
                          onClick={() => handleEdit(u)}
                          disabled={!canUpdate}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          title="Remove user"
                          onClick={() => handleDelete(u.id)}
                          disabled={!canDelete}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
