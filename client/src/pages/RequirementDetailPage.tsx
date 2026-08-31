import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "../components/common/Toast";
import { getRequirement, getRequirementHistory, updateRequirement, matchRequirement } from "../api/requirement";
import { createApplication, getRequirementApplications, type Application } from "../api/application";
import { type Requirement, type CandidateResult } from "../types";
import { PageHeader } from "../components/layout/PageHeader";
import { ApplicationDetailModal } from "../components/ApplicationDetailModal";

export function RequirementDetailPage() {
  const { id: requirementId = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate("/requirements");
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matchedCandidates, setMatchedCandidates] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "applications" | "matched" | "history">("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Requirement>>({});
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchData();
  }, [requirementId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, histData, appsData] = await Promise.all([
        getRequirement(requirementId),
        getRequirementHistory(requirementId),
        getRequirementApplications(requirementId)
      ]);
      setRequirement(reqData);
      setHistory(histData);
      setApplications(appsData);
      setEditData({
        title: reqData.title,
        status: reqData.status,
        minExperience: reqData.minExperience,
        maxExperience: reqData.maxExperience,
        jobDescription: reqData.jobDescription,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load requirement details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateRequirement(requirementId, editData);
      toast.success("Requirement updated");
      setIsEditing(false);
      fetchData(); // Refresh to get updated history
    } catch (error: any) {
      toast.error(error.message || "Failed to update requirement");
    }
  };

  const handleMatch = async () => {
    try {
      setMatching(true);
      const candidates = await matchRequirement(requirementId, 50);
      setMatchedCandidates(candidates);
      toast.success("Matching complete");
    } catch (error: any) {
      toast.error(error.message || "Failed to find candidates");
    } finally {
      setMatching(false);
    }
  };

  const handleAddToPipeline = async (candidateId: string, matchScore: number) => {
    try {
      await createApplication(candidateId, requirementId, matchScore);
      toast.success("Added to pipeline");
      // refresh applications
      const appsData = await getRequirementApplications(requirementId);
      setApplications(appsData);
    } catch (error: any) {
      toast.error(error.message || "Failed to add to pipeline");
    }
  };

  if (loading) {
    return <div className="status-indicator processing">Loading requirement...</div>;
  }

  if (!requirement) {
    return (
      <div className="empty-state">
        <h3>Requirement not found</h3>
        <button className="btn-secondary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const refreshApplications = async () => {
    const appsData = await getRequirementApplications(requirementId);
    setApplications(appsData);
  };

  return (
    <>
      {activeApplication && (
        <ApplicationDetailModal 
          application={activeApplication} 
          onClose={() => setActiveApplication(null)}
          onUpdate={refreshApplications}
        />
      )}
      <PageHeader
        icon="📄"
        title={requirement.title}
        description={`${requirement.requirementCode} • ${requirement.account?.displayName || "Unknown Account"}`}
      >
        <button className="btn-secondary" onClick={onBack}>
          ← Back to Requirements
        </button>
      </PageHeader>

      <div className="page-body">
        <div className="tabs" style={{ display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
          <button 
            className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
            style={{ background: "none", border: "none", color: activeTab === "details" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.1rem", fontWeight: activeTab === "details" ? 600 : 400 }}
          >
            Details
          </button>
          <button 
            className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
            style={{ background: "none", border: "none", color: activeTab === "applications" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.1rem", fontWeight: activeTab === "applications" ? 600 : 400 }}
          >
            Pipeline ({applications.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "matched" ? "active" : ""}`}
            onClick={() => setActiveTab("matched")}
            style={{ background: "none", border: "none", color: activeTab === "matched" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.1rem", fontWeight: activeTab === "matched" ? 600 : 400 }}
          >
            Matched Candidates
          </button>
          <button 
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
            style={{ background: "none", border: "none", color: activeTab === "history" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.1rem", fontWeight: activeTab === "history" ? 600 : 400 }}
          >
            History
          </button>
        </div>

        {activeTab === "details" && (
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3>Requirement Details</h3>
              <button 
                className="btn-secondary" 
                onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
              >
                {isEditing ? "Save Changes" : "Edit"}
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label className="text-muted text-sm">Status</label>
                {isEditing ? (
                  <select 
                    className="login-input"
                    value={editData.status || ""}
                    onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                    style={{ marginTop: "4px" }}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                ) : (
                  <div style={{ marginTop: "4px" }}>
                    <span className={`badge ${requirement.status === 'OPEN' ? 'badge-primary' : ''}`}>
                      {requirement.status}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-muted text-sm">Title</label>
                {isEditing ? (
                  <input 
                    className="login-input"
                    value={editData.title || ""}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    style={{ marginTop: "4px" }}
                  />
                ) : (
                  <div className="font-medium" style={{ marginTop: "4px" }}>{requirement.title}</div>
                )}
              </div>
              
              <div>
                <label className="text-muted text-sm">Experience (Min - Max years)</label>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <input 
                      type="number"
                      className="login-input"
                      value={editData.minExperience || ""}
                      onChange={(e) => setEditData({...editData, minExperience: parseFloat(e.target.value)})}
                      placeholder="Min"
                    />
                    <input 
                      type="number"
                      className="login-input"
                      value={editData.maxExperience || ""}
                      onChange={(e) => setEditData({...editData, maxExperience: parseFloat(e.target.value)})}
                      placeholder="Max"
                    />
                  </div>
                ) : (
                  <div className="font-medium" style={{ marginTop: "4px" }}>
                    {requirement.minExperience ?? "-"} to {requirement.maxExperience ?? "-"} years
                  </div>
                )}
              </div>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-muted text-sm">Job Description</label>
                {isEditing ? (
                  <textarea 
                    className="search-textarea"
                    value={editData.jobDescription || ""}
                    onChange={(e) => setEditData({...editData, jobDescription: e.target.value})}
                    style={{ width: "100%", height: "150px", padding: "12px", marginTop: "4px", resize: "vertical" }}
                  />
                ) : (
                  <div className="text-sm" style={{ marginTop: "4px", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px" }}>
                    {requirement.jobDescription}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "applications" && (
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <h3>Candidate Pipeline</h3>
            {applications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📋</span>
                <p>No candidates in pipeline yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Candidate</th>
                      <th>Match</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td className="text-muted text-sm">{app.applicationCode}</td>
                        <td>
                          <div className="font-medium text-heading">{app.candidate?.profile?.personalInfo?.name || "Unknown"}</div>
                          <div className="text-muted text-sm">{app.candidate?.totalExperienceYears ? `${app.candidate.totalExperienceYears} yrs` : "-"}</div>
                        </td>
                        <td>
                          {app.matchScore ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div className="score-bar-bg" style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                                <div className="score-bar-fill" style={{ width: `${Math.round(app.matchScore * 100)}%`, height: "100%", background: app.matchScore > 0.8 ? "#10b981" : app.matchScore > 0.6 ? "#f59e0b" : "#ef4444" }} />
                              </div>
                              <span className="text-sm font-medium">{Math.round(app.matchScore * 100)}%</span>
                            </div>
                          ) : "-"}
                        </td>
                        <td>
                          <span className="badge">{app.status}</span>
                        </td>
                        <td>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                            onClick={() => setActiveApplication(app)}
                          >
                            Manage Pipeline
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "matched" && (
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3>AI Matched Candidates</h3>
              <button 
                className="search-btn" 
                onClick={handleMatch}
                disabled={matching}
              >
                {matching ? "Analyzing..." : "Find Candidates"}
              </button>
            </div>

            {matchedCandidates.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🤖</span>
                <p>Click "Find Candidates" to rank resumes against this requirement's Job Description.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Skills</th>
                      <th>Match Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedCandidates.map((c) => (
                      <tr key={c.candidateId}>
                        <td>
                          <div className="font-medium text-heading">{c.metadata.name || "Unknown"}</div>
                          <div className="text-muted text-sm">{c.candidateExperienceYears ? `${c.candidateExperienceYears} yrs` : "Exp unknown"}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {c.metadata.skills.slice(0, 5).map(skill => (
                              <span key={skill} className="badge badge-primary text-xs">{skill}</span>
                            ))}
                            {c.metadata.skills.length > 5 && (
                              <span className="text-muted text-xs">+{c.metadata.skills.length - 5} more</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div className="score-bar-bg" style={{ width: "100px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                              <div className="score-bar-fill" style={{ width: `${Math.round(c.finalScore * 100)}%`, height: "100%", background: c.finalScore > 0.8 ? "#10b981" : c.finalScore > 0.6 ? "#f59e0b" : "#ef4444" }} />
                            </div>
                            <span className="font-medium">{Math.round(c.finalScore * 100)}%</span>
                          </div>
                        </td>
                        <td>
                          <button 
                            className="search-btn" 
                            style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                            onClick={() => handleAddToPipeline(c.candidateId, c.finalScore)}
                            disabled={applications.some(a => a.candidateId === c.candidateId)}
                          >
                            {applications.some(a => a.candidateId === c.candidateId) ? "In Pipeline" : "Add to Pipeline"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <h3>Requirement History</h3>
            {history.length === 0 ? (
              <p className="text-muted" style={{ marginTop: "1rem" }}>No history found.</p>
            ) : (
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {history.map((h, i) => (
                  <div key={h.id} style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
                    {/* Timeline line */}
                    {i !== history.length - 1 && (
                      <div style={{ position: "absolute", left: "15px", top: "30px", bottom: "-1rem", width: "2px", background: "rgba(255,255,255,0.1)" }} />
                    )}
                    
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                      {h.changeType === "CREATE" ? "✨" : h.changeType === "STATUS_CHANGE" ? "🔄" : h.changeType === "ASSIGNMENT_CHANGE" ? "👤" : "📝"}
                    </div>
                    
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", flexGrow: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong>{h.changeType.replace(/_/g, " ")}</strong>
                        <span className="text-muted text-sm">{new Date(h.changedAt).toLocaleString()}</span>
                      </div>
                      <div className="text-sm">
                        {h.remarks && <p>{h.remarks}</p>}
                        {h.field && (
                          <p style={{ marginTop: "8px" }}>
                            <span className="text-muted">{h.field}: </span>
                            <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{h.previousValue}</span>
                            <span style={{ margin: "0 8px" }}>→</span>
                            <span style={{ color: "#10b981" }}>{h.newValue}</span>
                          </p>
                        )}
                        <p className="text-muted text-xs" style={{ marginTop: "8px" }}>
                          By: {h.changedBy?.name || h.changedBy?.email || "System"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
