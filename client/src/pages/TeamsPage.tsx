import { useEffect, useState } from "react";
import { toast } from "../components/common/Toast";
import { listTeams, createTeam, deleteTeam, type Team } from "../api/team";
import { PageHeader } from "../components/layout/PageHeader";
import { Modal } from "../components/common/Modal";

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const teamsData = await listTeams();
      setTeams(teamsData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setIsCreating(true);
      // No organizationId needed — backend uses the user's own org automatically
      const newTeam = await createTeam(newTeamName.trim());
      setTeams([newTeam, ...teams]);
      setNewTeamName("");
      setIsModalOpen(false);
      toast.success("Team created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      await deleteTeam(id);
      setTeams(teams.filter((t) => t.id !== id));
      toast.success("Team deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete team");
    }
  };

  return (
    <>
      <PageHeader
        icon="🛡️"
        title="Teams"
        description="Manage teams and assign team managers."
      />
      <div className="page-body">
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button className="search-btn" onClick={() => setIsModalOpen(true)}>
          Create Team
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
        <form onSubmit={handleCreate} className="search-form">
          <div className="search-controls" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="text"
              className="login-input"
              placeholder="Enter team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button 
                type="button" 
                className="search-btn" 
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button type="submit" className="search-btn" disabled={isCreating || !newTeamName.trim()}>
                {isCreating ? (
                  <>
                    <span className="spinner-inline" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <div>
        {loading ? (
          <div className="status-indicator processing">Loading...</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🛡️</span>
            <h3>No teams found</h3>
            <p>Create a team above to get started.</p>
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
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="font-medium text-heading">{team.name}</td>
                    <td className="text-muted text-sm">{new Date(team.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="delete-btn"
                        title="Delete team"
                        onClick={() => handleDelete(team.id)}
                      >
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
    </div>
    </>
  );
}
