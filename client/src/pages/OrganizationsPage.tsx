import { useEffect, useState } from "react";
import { toast } from "../components/common/Toast";
import { listOrganizations, createOrganization, deleteOrganization, type Organization } from "../api/organization";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permissions";

export function OrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await listOrganizations();
      setOrganizations(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      setIsCreating(true);
      const newOrg = await createOrganization(newOrgName.trim());
      setOrganizations([newOrg, ...organizations]);
      setNewOrgName("");
      toast.success("Organization created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    try {
      await deleteOrganization(id);
      setOrganizations(organizations.filter((org) => org.id !== id));
      toast.success("Organization deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete organization");
    }
  };

  return (
    <>
      <PageHeader
        icon="🏢"
        title="Organizations"
        description="Manage all tenant organizations across the ATS platform."
      />
      <div className="page-body">
      {hasPermission(user, "organization:create") && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>Create New Organization</h3>
          <form onSubmit={handleCreate} className="search-form" style={{ marginTop: "1rem" }}>
            <div className="search-controls" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <input
                type="text"
                className="login-input"
                placeholder="Organization Name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                disabled={isCreating}
                style={{ flex: 1 }}
              />
              <button type="submit" className="search-btn" disabled={isCreating || !newOrgName.trim()}>
                {isCreating ? (
                  <>
                    <span className="spinner-inline" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        {loading ? (
          <div className="status-indicator processing">Loading...</div>
        ) : organizations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🏢</span>
            <h3>No organizations found</h3>
            <p>Create an organization above to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="font-medium text-heading">{org.name}</td>
                    <td className="text-muted text-sm">{new Date(org.createdAt).toLocaleDateString()}</td>
                    <td>
                      {hasPermission(user, "organization:delete") && (
                        <button 
                          className="delete-btn"
                          title="Delete organization"
                          onClick={() => handleDelete(org.id)}
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
