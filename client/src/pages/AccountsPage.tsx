import { useEffect, useState } from "react";
import { toast } from "../components/common/Toast";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "../api/account";
import { type Account } from "../types";
import { PageHeader } from "../components/layout/PageHeader";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [source, setSource] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await listAccounts();
      setAccounts(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setDisplayName(acc.displayName);
    setSource(acc.source || "");
    setContactPerson(acc.contactPerson || "");
    setContactEmail(acc.contactEmail || "");
    setContactNumber(acc.contactNumber || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setDisplayName("");
    setSource("");
    setContactPerson("");
    setContactEmail("");
    setContactNumber("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        displayName,
        source: source || undefined,
        contactPerson: contactPerson || undefined,
        contactEmail: contactEmail || undefined,
        contactNumber: contactNumber || undefined,
      };

      if (editingId) {
        await updateAccount(editingId, payload);
        toast.success("Account updated successfully");
      } else {
        await createAccount(payload);
        toast.success("Account created successfully");
      }
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await deleteAccount(id);
      setAccounts(accounts.filter((a) => a.id !== id));
      toast.success("Account deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  return (
    <>
      <PageHeader
        icon="🏢"
        title="Accounts (Clients)"
        description="Manage client organizations and contacts."
      >
        <button className="search-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Account"}
        </button>
      </PageHeader>

      <div className="page-body">
        {showForm && (
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px", marginBottom: "2rem" }}>
            <h3>{editingId ? "Edit Account" : "Add New Account"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "1rem" }}>
              <div className="create-user-field">
                <label>Account Name *</label>
                <input
                  className="login-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>
              <div className="create-user-field">
                <label>Source</label>
                <input
                  className="login-input"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Referral, Website"
                />
              </div>
              <div className="create-user-field">
                <label>Contact Person</label>
                <input
                  className="login-input"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="create-user-field">
                <label>Contact Email</label>
                <input
                  type="email"
                  className="login-input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john@acme.dev"
                />
              </div>
              <div className="create-user-field">
                <label>Contact Number</label>
                <input
                  className="login-input"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn-secondary" onClick={resetForm} disabled={isSubmitting} >
                  Cancel
                </button>
                <button type="submit" className="search-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="status-indicator processing">Loading accounts...</div>
        ) : accounts.length === 0 && !showForm ? (
          <div className="empty-state">
            <span className="empty-state-icon">🏢</span>
            <h3>No accounts found</h3>
            <p>Click "Add Account" to create your first client.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>Source</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="font-medium text-heading">{acc.displayName}</td>
                    <td>{acc.source || "-"}</td>
                    <td>
                      <div>{acc.contactPerson || "-"}</div>
                      <div className="text-muted text-sm">{acc.contactEmail}</div>
                    </td>
                    <td>
                      <span className={`badge ${acc.status === 'ACTIVE' ? 'badge-primary' : ''}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => handleEdit(acc)} style={{ marginRight: 10 }}>
                        ✏️
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(acc.id)}>
                        🗑
                      </button>
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
