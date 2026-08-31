import { useEffect, useState, useMemo } from "react";
import { toast } from "../components/common/Toast";
import { listRequirements } from "../api/requirement";
import {
  getRequirementApplications,
  createApplication,
  type Application,
} from "../api/application";
import { listCandidates } from "../api/client";
import { ApplicationDetailModal } from "../components/ApplicationDetailModal";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../context/AuthContext";
import type { Requirement, ListCandidate } from "../types";

const STATUS_COLORS: Record<string, string> = {
  NEW:         "rgba(100,116,139,0.3)",
  SCREENING:   "rgba(245,158,11,0.3)",
  SHORTLISTED: "rgba(59,130,246,0.3)",
  INTERVIEW:   "rgba(139,92,246,0.3)",
  SELECTED:    "rgba(16,185,129,0.3)",
  REJECTED:    "rgba(239,68,68,0.3)",
  HIRED:       "rgba(5,150,105,0.3)",
};
const STATUS_TEXT: Record<string, string> = {
  NEW:         "#94a3b8",
  SCREENING:   "#fbbf24",
  SHORTLISTED: "#60a5fa",
  INTERVIEW:   "#a78bfa",
  SELECTED:    "#34d399",
  REJECTED:    "#f87171",
  HIRED:       "#10b981",
};

export function ApplicationsPage() {
  const { hasPermission } = useAuth();

  // ─── Requirements list (left panel) ────────────────────────
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [reqSearch, setReqSearch] = useState("");

  // ─── Pipeline for selected requirement (right panel) ───────
  const [applications, setApplications] = useState<Application[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);

  // ─── Add Candidate modal ────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [allCandidates, setAllCandidates] = useState<ListCandidate[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const canUpdate = hasPermission("application:update");
  const canCreate = hasPermission("application:create");

  // ─── Load requirements ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setReqLoading(true);
        const data = await listRequirements();
        setRequirements(data);
        // Auto-select first OPEN requirement if any
        const first = data.find((r) => r.status === "OPEN") ?? data[0];
        if (first) setSelectedReq(first);
      } catch (e: any) {
        toast.error(e.message || "Failed to load requirements");
      } finally {
        setReqLoading(false);
      }
    };
    load();
  }, []);

  // ─── Load pipeline when requirement changes ─────────────────
  useEffect(() => {
    if (!selectedReq) return;
    const load = async () => {
      try {
        setPipelineLoading(true);
        const apps = await getRequirementApplications(selectedReq.id);
        setApplications(apps);
      } catch (e: any) {
        toast.error(e.message || "Failed to load pipeline");
      } finally {
        setPipelineLoading(false);
      }
    };
    load();
  }, [selectedReq]);

  const refreshPipeline = async () => {
    if (!selectedReq) return;
    const apps = await getRequirementApplications(selectedReq.id);
    setApplications(apps);
  };

  // ─── Open add-candidate modal ───────────────────────────────
  const openAddModal = async () => {
    setShowAddModal(true);
    setCandidateSearch("");
    try {
      setCandidatesLoading(true);
      const res = await listCandidates();
      setAllCandidates(res.candidates);
    } catch (e: any) {
      toast.error(e.message || "Failed to load candidates");
    } finally {
      setCandidatesLoading(false);
    }
  };

  // IDs already in the pipeline
  const pipelineCandidateIds = useMemo(
    () => new Set(applications.map((a) => a.candidateId)),
    [applications]
  );

  // Filtered candidates for picker (exclude already-added)
  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.toLowerCase();
    return allCandidates.filter((c) => {
      if (pipelineCandidateIds.has(c.id)) return false;
      const name: string = c.profile?.personalInfo?.name || c.profile?.name || "";
      return !q || name.toLowerCase().includes(q);
    });
  }, [allCandidates, candidateSearch, pipelineCandidateIds]);

  const handleAddCandidate = async (candidate: ListCandidate) => {
    if (!selectedReq) return;
    try {
      setAddingId(candidate.id);
      await createApplication(candidate.id, selectedReq.id);
      toast.success("Candidate added to pipeline");
      await refreshPipeline();
      // Re-filter will happen automatically via pipelineCandidateIds memo
    } catch (e: any) {
      toast.error(e.message || "Failed to add candidate");
    } finally {
      setAddingId(null);
    }
  };

  // ─── Filtered requirements (left search) ────────────────────
  const filteredReqs = useMemo(() => {
    const q = reqSearch.toLowerCase();
    if (!q) return requirements;
    return requirements.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.requirementCode.toLowerCase().includes(q) ||
        r.account?.displayName?.toLowerCase().includes(q)
    );
  }, [requirements, reqSearch]);

  // ─── Pipeline stats ──────────────────────────────────────────
  const pipelineStats = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

  return (
    <>
      {/* Pipeline Management Modal */}
      {activeApplication && (
        <ApplicationDetailModal
          application={activeApplication}
          onClose={() => setActiveApplication(null)}
          onUpdate={refreshPipeline}
        />
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div
            className="glass-card"
            style={{
              width: "600px", maxWidth: "100%", maxHeight: "80vh",
              display: "flex", flexDirection: "column",
              borderRadius: "20px", padding: "0", overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>➕ Add Candidate to Pipeline</h3>
                <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  {selectedReq?.title} — {selectedReq?.requirementCode}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Search inside modal */}
            <div style={{ padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <input
                type="text"
                className="login-input"
                placeholder="Search candidates by name..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                style={{ width: "100%", height: "40px", padding: "0 14px" }}
                autoFocus
              />
            </div>

            {/* Candidate list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {candidatesLoading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading candidates...</div>
              ) : filteredCandidates.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  {allCandidates.length === 0 ? "No candidates found in the system." : "All candidates are already in the pipeline."}
                </div>
              ) : (
                filteredCandidates.map((c) => {
                  const name: string = c.profile?.personalInfo?.name || c.profile?.name || "Unknown";
                  const exp = c.totalExperienceYears;
                  const skills: string[] = c.profile?.skills?.slice(0, 4) || [];
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "1rem 2rem",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{name}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "2px" }}>
                          {exp != null ? `${exp} yrs experience` : "Exp unknown"}
                          {skills.length > 0 && (
                            <span> · {skills.join(", ")}</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="search-btn"
                        style={{ padding: "6px 16px", fontSize: "0.82rem", flexShrink: 0 }}
                        onClick={() => handleAddCandidate(c)}
                        disabled={addingId === c.id}
                      >
                        {addingId === c.id ? "Adding..." : "+ Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <PageHeader
        icon="🗂️"
        title="Applications"
        description="Select a requirement to manage its candidate pipeline."
      />

      <div className="page-body" style={{ padding: 0 }}>
        <div style={{ display: "flex", height: "calc(100vh - 140px)", gap: 0 }}>

          {/* ── Left Panel: Requirements List ─────────────────── */}
          <div
            style={{
              width: "300px", flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.08)",
              display: "flex", flexDirection: "column",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {/* Search */}
            <div style={{ padding: "16px" }}>
              <input
                type="text"
                className="login-input"
                placeholder="Search requirements..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                style={{ width: "100%", height: "38px", padding: "0 12px", fontSize: "0.85rem" }}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {reqLoading ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Loading...
                </div>
              ) : filteredReqs.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  No requirements found
                </div>
              ) : (
                filteredReqs.map((req) => {
                  const isSelected = selectedReq?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      style={{
                        padding: "14px 16px",
                        cursor: "pointer",
                        borderLeft: isSelected ? "3px solid var(--accent-primary)" : "3px solid transparent",
                        background: isSelected ? "rgba(79,70,229,0.12)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ fontWeight: isSelected ? 700 : 500, fontSize: "0.88rem", marginBottom: "4px" }}>
                        {req.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{req.requirementCode}</span>
                        <span
                          style={{
                            fontSize: "0.68rem", fontWeight: 600, padding: "2px 6px", borderRadius: "4px",
                            background: req.status === "OPEN" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
                            color: req.status === "OPEN" ? "#34d399" : "var(--text-muted)",
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.account?.displayName && (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>
                          {req.account.displayName}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Panel: Pipeline ──────────────────────────── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {!selectedReq ? (
              <div className="empty-state">
                <span className="empty-state-icon">👈</span>
                <h3>Select a Requirement</h3>
                <p>Pick a job requirement from the left to view and manage its candidate pipeline.</p>
              </div>
            ) : (
              <>
                {/* Requirement Header */}
                <div className="glass-card" style={{ padding: "1.5rem 2rem", borderRadius: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                      <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{selectedReq.title}</h2>
                      <span
                        style={{
                          fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
                          background: selectedReq.status === "OPEN" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)",
                          color: selectedReq.status === "OPEN" ? "#34d399" : "var(--text-muted)",
                        }}
                      >
                        {selectedReq.status}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span>📋 {selectedReq.requirementCode}</span>
                      {selectedReq.account?.displayName && <span>🏢 {selectedReq.account.displayName}</span>}
                      <span>👥 {selectedReq.numberOfOpenings} opening{selectedReq.numberOfOpenings !== 1 ? "s" : ""}</span>
                      {selectedReq.location && <span>📍 {selectedReq.location}</span>}
                    </div>
                  </div>

                  {canCreate && (
                    <button
                      className="search-btn"
                      style={{ padding: "10px 22px", fontSize: "0.88rem", flexShrink: 0 }}
                      onClick={openAddModal}
                    >
                      ➕ Add Candidate
                    </button>
                  )}
                </div>

                {/* Pipeline Stage Summary */}
                {applications.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                    {["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED", "HIRED"].map((stage) => {
                      const count = pipelineStats[stage] || 0;
                      if (!count) return null;
                      return (
                        <div
                          key={stage}
                          style={{
                            padding: "8px 14px", borderRadius: "10px",
                            background: STATUS_COLORS[stage],
                            border: `1px solid ${STATUS_TEXT[stage]}40`,
                            display: "flex", alignItems: "center", gap: "8px",
                          }}
                        >
                          <span style={{ color: STATUS_TEXT[stage], fontWeight: 700, fontSize: "1rem" }}>{count}</span>
                          <span style={{ color: STATUS_TEXT[stage], fontSize: "0.75rem", fontWeight: 600 }}>{stage}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pipeline Table */}
                {pipelineLoading ? (
                  <div className="status-indicator processing">Loading pipeline...</div>
                ) : applications.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">📂</span>
                    <h3>No candidates in pipeline</h3>
                    <p>
                      {canCreate
                        ? <>Click <strong>➕ Add Candidate</strong> above to add candidates to this requirement.</>
                        : "No candidates have been added to this requirement yet."}
                    </p>
                  </div>
                ) : (
                  <div className="glass-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ paddingLeft: "20px" }}>App Code</th>
                          <th>Candidate</th>
                          <th>Experience</th>
                          <th>Match Score</th>
                          <th>Stage</th>
                          {canUpdate && <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => {
                          const name: string =
                            (app as any).candidate?.profile?.personalInfo?.name ||
                            (app as any).candidate?.profile?.name ||
                            "Unknown";
                          const exp = (app as any).candidate?.totalExperienceYears;
                          const score = app.matchScore;
                          const isTerminal = app.status === "REJECTED" || app.status === "HIRED";
                          return (
                            <tr key={app.id}>
                              <td style={{ paddingLeft: "20px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "monospace" }}>
                                  {app.applicationCode}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{name}</div>
                              </td>
                              <td>
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                  {exp != null ? `${exp} yrs` : "—"}
                                </span>
                              </td>
                              <td>
                                {score != null ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                                      <div style={{
                                        height: "100%",
                                        width: `${Math.round(score * 100)}%`,
                                        background: score > 0.8 ? "#10b981" : score > 0.6 ? "#f59e0b" : "#ef4444",
                                        borderRadius: "3px",
                                      }} />
                                    </div>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                                      {Math.round(score * 100)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--text-muted)" }}>—</span>
                                )}
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px", borderRadius: "8px",
                                    background: STATUS_COLORS[app.status],
                                    color: STATUS_TEXT[app.status],
                                    fontSize: "0.78rem", fontWeight: 700,
                                  }}
                                >
                                  {app.status}
                                </span>
                              </td>
                              {canUpdate && (
                                <td style={{ textAlign: "right", paddingRight: "20px" }}>
                                  {isTerminal ? (
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                      {app.status === "HIRED" ? "🎉 Hired" : "❌ Rejected"}
                                    </span>
                                  ) : (
                                    <button
                                      className="search-btn"
                                      style={{ padding: "5px 14px", fontSize: "0.82rem" }}
                                      onClick={() => setActiveApplication(app)}
                                    >
                                      Manage Pipeline →
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
