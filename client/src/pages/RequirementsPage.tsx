import { useEffect, useState } from "react";
import { toast } from "../components/common/Toast";
import { listRequirements, createRequirement, deleteRequirement } from "../api/requirement";
import { listAccounts } from "../api/account";
import { type Requirement, type Account } from "../types";
import { PageHeader } from "../components/layout/PageHeader";

interface RequirementsPageProps {
  onNavigateToDetail?: (id: string) => void;
}

export function RequirementsPage({ onNavigateToDetail }: RequirementsPageProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [numberOfOpenings, setNumberOfOpenings] = useState(1);
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, accData] = await Promise.all([
        listRequirements(),
        listAccounts()
      ]);
      setRequirements(reqData);
      setAccounts(accData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load requirements");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAccountId("");
    setTitle("");
    setJobDescription("");
    setNumberOfOpenings(1);
    setLocation("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !accountId) return;

    try {
      setIsSubmitting(true);
      await createRequirement({
        accountId,
        title,
        jobDescription,
        numberOfOpenings,
        location: location || undefined
      });
      toast.success("Requirement created successfully");
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create requirement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this requirement?")) return;
    try {
      await deleteRequirement(id);
      setRequirements(requirements.filter((r) => r.id !== id));
      toast.success("Requirement deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete requirement");
    }
  };

  return (
    <>
      <PageHeader
        icon="📋"
        title="Job Requirements"
        description="Manage job orders and requirements for accounts."
      >
        <button className="search-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Requirement"}
        </button>
      </PageHeader>

      <div className="page-body">
        {showForm && (
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px", marginBottom: "2rem" }}>
            <h3>Create New Requirement</h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "1rem" }}>
              <div className="create-user-field">
                <label>Account *</label>
                <select
                  className="login-input"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="create-user-field">
                <label>Job Title *</label>
                <input
                  className="login-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  required
                />
              </div>
              <div className="create-user-field" style={{ gridColumn: "1 / -1" }}>
                <label>Job Description *</label>
                <textarea
                  className="search-textarea"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Detailed job description..."
                  required
                  style={{ width: "100%", height: "120px", padding: "12px", resize: "vertical" }}
                />
              </div>
              <div className="create-user-field">
                <label>Number of Openings</label>
                <input
                  type="number"
                  min="1"
                  className="login-input"
                  value={numberOfOpenings}
                  onChange={(e) => setNumberOfOpenings(parseInt(e.target.value))}
                />
              </div>
              <div className="create-user-field">
                <label>Location</label>
                <input
                  className="login-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / New York"
                />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn-secondary" onClick={resetForm} disabled={isSubmitting} style={{ padding: "0 20px" }}>
                  Cancel
                </button>
                <button type="submit" className="search-btn" disabled={isSubmitting} style={{ padding: "0 20px" }}>
                  {isSubmitting ? "Creating..." : "Create Requirement"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="status-indicator processing">Loading requirements...</div>
        ) : requirements.length === 0 && !showForm ? (
          <div className="empty-state">
            <span className="empty-state-icon">📋</span>
            <h3>No requirements found</h3>
            <p>Click "Add Requirement" to create your first job requirement.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Req Code</th>
                  <th>Job Title</th>
                  <th>Account</th>
                  <th>Openings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id}>
                    <td className="text-muted text-sm">{req.requirementCode}</td>
                    <td className="font-medium text-heading">{req.title}</td>
                    <td>{req.account?.displayName || "-"}</td>
                    <td>{req.numberOfOpenings}</td>
                    <td>
                      <span className={`badge ${req.status === 'OPEN' ? 'badge-primary' : ''}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                          onClick={() => onNavigateToDetail && onNavigateToDetail(req.id)}
                        >
                          View
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(req.id)}>
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
