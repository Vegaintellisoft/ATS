import { useState, useEffect } from "react";
import { toast } from "../components/common/Toast";
import { listRoles, createRole, updateRole, deleteRole, listPermissions } from "../api/role";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../context/AuthContext";
import { type Role, type Permission } from "../types";

export function RoleMasterPage() {
  const { user } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, pData] = await Promise.all([
        listRoles(user?.organizationId || undefined),
        listPermissions()
      ]);
      setRoles(rData);
      setPermissionsList(pData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setSelectedPerms(new Set());
    setShowForm(false);
  };

  const handleEdit = (role: Role) => {
    if (role.name === "SUPER_ADMIN") {
      toast.error("Cannot edit SUPER_ADMIN role");
      return;
    }
    setEditingId(role.id);
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPerms(new Set(role.permissions));
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (name === "SUPER_ADMIN") {
      toast.error("Cannot delete system roles");
      return;
    }
    if (!confirm(`Are you sure you want to delete the role "${name}"?`)) return;
    
    try {
      await deleteRole(id);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    }
  };

  const togglePermission = (key: string) => {
    const newPerms = new Set(selectedPerms);
    if (newPerms.has(key)) {
      newPerms.delete(key);
    } else {
      newPerms.add(key);
    }
    setSelectedPerms(newPerms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Role name is required");
    
    try {
      setIsSubmitting(true);
      const permissionKeys = Array.from(selectedPerms);
      
      if (editingId) {
        await updateRole(editingId, { name, description, permissionKeys });
        toast.success("Role updated successfully");
      } else {
        await createRole({ 
          name, 
          description, 
          permissionKeys,
          organizationId: user?.organizationId || undefined 
        });
        toast.success("Role created successfully");
      }
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save role");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions for better UI
  const groupedPermissions = permissionsList.reduce((acc, p) => {
    const prefix = p.key.split(":")[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <>
      <PageHeader
        icon="🔐"
        title="Role Master"
        description="Manage roles and their granular permissions"
      >
        <button
          className="search-btn"
          style={{ padding: "10px 24px", fontSize: "0.9rem" }}
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
        >
          {showForm ? "✕ Cancel" : "➕ Create Role"}
        </button>
      </PageHeader>

      <div className="page-body">
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
              {editingId ? "✏️ Edit Role" : "➕ Create New Role"}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div className="create-user-field">
                  <label>Role Name <span style={{ color: "var(--accent-primary)" }}>*</span></label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="e.g., HR_MANAGER"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    disabled={isSubmitting}
                    required
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>
                
                <div className="create-user-field">
                  <label>Description</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Role description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "12px", fontWeight: 500, fontSize: "0.95rem" }}>
                  Permissions <span style={{ color: "var(--accent-primary)" }}>*</span>
                </label>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <div key={group} style={{ 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid var(--border-hover)",
                      borderRadius: "14px",
                      padding: "18px",
                      backdropFilter: "blur(12px)"
                    }}>
                      <h4 style={{ textTransform: "uppercase", marginBottom: "14px", color: "var(--accent-light)", fontSize: "0.75rem", letterSpacing: "0.08em", fontWeight: 700 }}>
                        {group}
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {perms.map(p => (
                          <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer", color: "var(--text-primary)" }}>
                            <input
                              type="checkbox"
                              checked={selectedPerms.has(p.key)}
                              onChange={() => togglePermission(p.key)}
                              disabled={isSubmitting}
                              style={{ width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer" }}
                            />
                            <span>{p.key.split(":")[1]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="search-btn"
                disabled={isSubmitting || !name || selectedPerms.size === 0}
                style={{ height: "48px", width: "100%", maxWidth: "300px" }}
              >
                {isSubmitting ? "Saving..." : "✓ Save Role"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="status-indicator processing">Loading...</div>
        ) : roles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔐</span>
            <h3>No roles found</h3>
            <p>Click <strong>➕ Create Role</strong> above to add your first role.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "180px", paddingLeft: "20px" }}>Role Name</th>
                  <th style={{ minWidth: "220px" }}>Description</th>
                  <th style={{ minWidth: "280px" }}>Permissions</th>
                  <th style={{ minWidth: "130px" }}>Assigned Users</th>
                  <th style={{ minWidth: "130px", textAlign: "right", paddingRight: "20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td style={{ minWidth: "180px", paddingLeft: "20px" }}>
                      <div className="font-medium" style={{ color: "var(--accent-light)", fontSize: "0.95rem", fontWeight: 700 }}>
                        {r.name}
                      </div>
                    </td>
                    <td style={{ minWidth: "220px", maxWidth: "320px", whiteSpace: "normal" }}>
                      <div className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {r.description || "-"}
                      </div>
                    </td>
                    <td style={{ minWidth: "280px", whiteSpace: "normal" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {r.permissions.slice(0, 5).map(p => (
                          <span key={p} className="badge badge-primary" style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
                            {p}
                          </span>
                        ))}
                        {r.permissions.length > 5 && (
                          <span className="badge" style={{ fontSize: "0.72rem", padding: "4px 8px", background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
                            +{r.permissions.length - 5} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ minWidth: "130px" }}>
                      <span className="badge" style={{ 
                        background: r.userCount > 0 ? "rgba(52, 211, 153, 0.12)" : "rgba(255,255,255,0.05)", 
                        color: r.userCount > 0 ? "#34d399" : "var(--text-muted)", 
                        border: r.userCount > 0 ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid var(--border)" 
                      }}>
                        {r.userCount} {r.userCount === 1 ? "user" : "users"}
                      </span>
                    </td>
                    <td style={{ minWidth: "130px", paddingRight: "20px" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className="search-btn"
                          style={{ padding: "4px 14px", height: "32px", fontSize: "0.82rem", background: "rgba(255,255,255,0.1)" }}
                          onClick={() => handleEdit(r)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          title="Delete role"
                          onClick={() => handleDelete(r.id, r.name)}
                          disabled={r.userCount > 0 || r.name === "SUPER_ADMIN" || r.name === "ADMIN"}
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
