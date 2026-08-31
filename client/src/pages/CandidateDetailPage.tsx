import { useState, useEffect } from "react";
import { getCandidateDetail, getCandidateActivity } from "../api/candidate";
import { toast } from "../components/common/Toast";
import { PageHeader } from "../components/layout/PageHeader";

interface CandidateDetailPageProps {
  candidateId: string;
  onBack: () => void;
}

const PIPELINE_STAGES = ["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "HIRED"];

const STATUS_COLORS: Record<string, string> = {
  NEW: "#6366f1",
  SCREENING: "#f59e0b",
  SHORTLISTED: "#3b82f6",
  INTERVIEW: "#8b5cf6",
  SELECTED: "#10b981",
  HIRED: "#059669",
  REJECTED: "#ef4444",
};

function PipelineStepper({ status }: { status: string }) {
  if (status === "REJECTED") {
    return (
      <span style={{ padding: "4px 12px", borderRadius: "12px", background: "#ef4444", color: "#fff", fontSize: "0.8rem", fontWeight: 600 }}>
        REJECTED
      </span>
    );
  }
  const currentIdx = PIPELINE_STAGES.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      {PIPELINE_STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={stage} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: active ? 700 : 400,
              background: done ? "rgba(99,102,241,0.3)" : active ? STATUS_COLORS[stage] || "#6366f1" : "rgba(255,255,255,0.07)",
              color: done || active ? "#fff" : "rgba(255,255,255,0.4)",
              border: active ? `1px solid ${STATUS_COLORS[stage]}` : "1px solid transparent",
              transition: "all 0.2s",
            }}>
              {stage}
            </span>
            {idx < PIPELINE_STAGES.length - 1 && (
              <span style={{ color: done ? "#6366f1" : "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CandidateDetailPage({ candidateId, onBack }: CandidateDetailPageProps) {
  const [candidate, setCandidate] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "applications" | "activity">("profile");

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const data = await getCandidateDetail(candidateId);
      setCandidate(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  const handleActivityTab = async () => {
    setActiveTab("activity");
    if (activity.length === 0) {
      try {
        setLoadingActivity(true);
        const data = await getCandidateActivity(candidateId);
        setActivity(data);
      } catch (error: any) {
        toast.error("Failed to load activity");
      } finally {
        setLoadingActivity(false);
      }
    }
  };

  if (loading) return <div className="status-indicator processing">Loading candidate...</div>;
  if (!candidate) return <div className="empty-state"><h3>Candidate not found</h3><button className="btn-secondary" onClick={onBack}>Go Back</button></div>;

  const profile = (candidate.profile as any) || {};
  const personalInfo = profile?.candidate || profile?.personalInfo || {};
  const name = personalInfo?.name || "Unknown Candidate";
  const currentTitle = personalInfo?.currentTitle || personalInfo?.title || "";
  const skills = profile?.skills?.technical || profile?.skills || [];
  const experience = profile?.experience || [];

  const tabStyle = (tab: string) => ({
    background: "none",
    border: "none",
    color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: activeTab === tab ? 700 : 400,
    padding: "8px 0",
    borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
    transition: "all 0.2s",
  });

  return (
    <>
      <PageHeader
        icon="👤"
        title={name}
        description={currentTitle || `${candidate.totalExperienceYears?.toFixed(1) ?? "?"} years experience`}
      >
        <button className="btn-secondary" onClick={onBack}>
          ← Back to Candidates
        </button>
      </PageHeader>

      {/* Hero card */}
      <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          {/* Left: Avatar + info */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0,
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{name}</h2>
              {currentTitle && <p className="text-muted" style={{ margin: "4px 0 0" }}>{currentTitle}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "8px", flexWrap: "wrap" }}>
                {candidate.totalExperienceYears != null && (
                  <span className="badge">⏱ {candidate.totalExperienceYears.toFixed(1)} yrs</span>
                )}
                {candidate.applications?.length > 0 && (
                  <span className="badge">📋 {candidate.applications.length} Application{candidate.applications.length !== 1 ? "s" : ""}</span>
                )}
                {candidate.document?.originalName && (
                  <span className="badge">📄 {candidate.document.originalName}</span>
                )}
              </div>
            </div>
          </div>
          {/* Right: assigned recruiter */}
          {candidate.assignedManager && (
            <div style={{ textAlign: "right" }}>
              <p className="text-muted text-sm">Assigned Manager</p>
              <p className="font-medium">{candidate.assignedManager.name || candidate.assignedManager.email}</p>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <p className="text-muted text-sm" style={{ marginBottom: "8px" }}>Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(Array.isArray(skills) ? skills : Object.keys(skills)).slice(0, 20).map((skill: string, i: number) => (
                <span key={i} style={{
                  padding: "4px 12px", borderRadius: "20px",
                  background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
                  fontSize: "0.8rem", color: "#a5b4fc",
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "1.5rem" }}>
        <button style={tabStyle("profile")} onClick={() => setActiveTab("profile")}>Profile</button>
        <button style={tabStyle("applications")} onClick={() => setActiveTab("applications")}>
          Applications ({candidate.applications?.length ?? 0})
        </button>
        <button style={tabStyle("activity")} onClick={handleActivityTab}>Activity</button>
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Experience timeline */}
          <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
            <h4 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Work Experience</h4>
            {experience.length === 0 ? (
              <p className="text-muted">No experience data available.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {experience.map((exp: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", marginTop: "6px", flexShrink: 0 }} />
                    <div>
                      <p className="font-medium" style={{ margin: 0 }}>{exp.role || exp.title || "Unknown Role"}</p>
                      <p className="text-muted text-sm" style={{ margin: "2px 0" }}>{exp.company || ""}</p>
                      <p className="text-muted text-xs">{exp.duration || exp.period || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education + meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>Education</h4>
              {(profile?.education || []).length === 0 ? (
                <p className="text-muted">No education data.</p>
              ) : (
                (profile.education as any[]).map((edu: any, i: number) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <p className="font-medium" style={{ margin: 0 }}>{edu.degree || edu.qualification || ""}</p>
                    <p className="text-muted text-sm">{edu.institution || edu.college || ""}</p>
                    <p className="text-muted text-xs">{edu.year || edu.passedOut || ""}</p>
                  </div>
                ))
              )}
            </div>
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>Document</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted text-sm">Resume</span>
                  <span className="text-sm">{candidate.document?.originalName || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted text-sm">Parse Status</span>
                  <span className="text-sm">{candidate.document?.status || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted text-sm">Uploaded By</span>
                  <span className="text-sm">{candidate.createdBy?.name || candidate.createdBy?.email || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted text-sm">Uploaded At</span>
                  <span className="text-sm">{candidate.document?.createdAt ? new Date(candidate.document.createdAt).toLocaleDateString() : "-"}</span>
                </div>
              </div>
              <a
                href={`/api/v1/candidates/${candidateId}/resume`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ display: "inline-block", marginTop: "1rem", padding: "8px 16px", textDecoration: "none", fontSize: "0.9rem" }}
              >
                📄 View Resume
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Applications Tab ── */}
      {activeTab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {candidate.applications?.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <p>No applications yet. Add this candidate to a requirement pipeline to get started.</p>
            </div>
          ) : (
            candidate.applications.map((app: any) => (
              <div key={app.id} className="glass-card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h4 style={{ margin: 0 }}>{app.requirement?.title || "Unknown Requirement"}</h4>
                      <span className="text-muted text-xs" style={{ padding: "2px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.07)" }}>
                        {app.applicationCode}
                      </span>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
                      🏢 {app.requirement?.account?.displayName || "Unknown Account"}
                      {app.requirement?.location ? ` • 📍 ${app.requirement.location}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {app.matchScore != null && (
                      <span style={{
                        padding: "4px 12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700,
                        background: app.matchScore > 0.8 ? "rgba(16,185,129,0.2)" : app.matchScore > 0.6 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                        color: app.matchScore > 0.8 ? "#10b981" : app.matchScore > 0.6 ? "#f59e0b" : "#ef4444",
                        border: `1px solid ${app.matchScore > 0.8 ? "#10b981" : app.matchScore > 0.6 ? "#f59e0b" : "#ef4444"}`,
                      }}>
                        {Math.round(app.matchScore * 100)}% match
                      </span>
                    )}
                  </div>
                </div>
                <PipelineStepper status={app.status} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                  <span className="text-muted text-xs">Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.assignedRecruiter && (
                    <span className="text-muted text-xs">Recruiter: {app.assignedRecruiter.name || app.assignedRecruiter.email}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Activity Tab ── */}
      {activeTab === "activity" && (
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
          <h4 style={{ marginTop: 0 }}>Recent Activity</h4>
          {loadingActivity ? (
            <p className="text-muted">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="text-muted">No activity recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activity.map((log: any, i: number) => (
                <div key={log.id} style={{ display: "flex", gap: "1.2rem", position: "relative" }}>
                  {i < activity.length - 1 && (
                    <div style={{ position: "absolute", left: "15px", top: "30px", bottom: "-1rem", width: "2px", background: "rgba(255,255,255,0.07)" }} />
                  )}
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, fontSize: "0.9rem" }}>
                    {log.action?.includes("PIPELINE") ? "🔄" : log.action?.includes("CREAT") ? "✨" : "📝"}
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.9rem 1rem", borderRadius: "10px", flexGrow: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="font-medium text-sm">{log.action?.replace(/_/g, " ")}</span>
                      <span className="text-muted text-xs">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-muted text-xs" style={{ margin: 0 }}>by {log.performedBy?.name || log.performedBy?.email || "System"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
