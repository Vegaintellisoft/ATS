import { useEffect, useState } from "react";
import { getApplicationHistory, updateApplicationStatus, type Application } from "../api/application";
import { toast } from "./common/Toast";

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
  onUpdate: () => void;
}

const PIPELINE_STAGES = ["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "HIRED"];

export function ApplicationDetailModal({ application, onClose, onUpdate }: ApplicationDetailModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [application.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getApplicationHistory(application.id);
      setHistory(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "REJECTED" && !remarks) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    try {
      setIsUpdating(true);
      await updateApplicationStatus(application.id, newStatus, remarks);
      toast.success(`Candidate moved to ${newStatus}`);
      setRemarks("");
      fetchHistory();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStageIndex = PIPELINE_STAGES.indexOf(application.status);
  const nextStage = PIPELINE_STAGES[currentStageIndex + 1];

  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div className="glass-card" style={{ width: "800px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", padding: "2rem", borderRadius: "16px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
        
        <h3>Pipeline Management</h3>
        <p className="text-muted" style={{ marginBottom: "2rem" }}>
          {application.candidate?.profile?.personalInfo?.name || "Candidate"} • {application.requirement?.title}
        </p>

        {/* Stepper */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", position: "relative" }}>
          <div style={{ position: "absolute", top: "15px", left: "0", right: "0", height: "2px", background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isRejected = application.status === "REJECTED";
            
            let color = "rgba(255,255,255,0.2)";
            if (isCompleted || isCurrent) color = "#3b82f6";
            if (isCurrent && isRejected) color = "#ef4444";
            if (isCurrent && stage === "HIRED") color = "#10b981";

            return (
              <div key={stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0f172a" }}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className="text-xs" style={{ color: isCurrent ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: isCurrent ? "bold" : "normal" }}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {application.status !== "REJECTED" && application.status !== "HIRED" && (
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
            <h4 style={{ marginBottom: "1rem" }}>Move to Next Stage</h4>
            <textarea 
              placeholder="Add remarks (optional for progression, required for rejection)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="search-textarea"
              style={{ width: "100%", height: "80px", padding: "12px", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                className="btn-secondary" 
                style={{ color: "#ef4444", borderColor: "#ef4444" }}
                onClick={() => handleStatusChange("REJECTED")}
                disabled={isUpdating}
              >
                Reject Candidate
              </button>
              {nextStage && (
                <button 
                  className="search-btn"
                  onClick={() => handleStatusChange(nextStage)}
                  disabled={isUpdating}
                >
                  Move to {nextStage}
                </button>
              )}
            </div>
          </div>
        )}

        {/* History */}
        <h4>Pipeline History</h4>
        {loading ? (
          <p className="text-muted" style={{ marginTop: "1rem" }}>Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-muted" style={{ marginTop: "1rem" }}>No history available.</p>
        ) : (
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {history.map((h, i) => (
              <div key={h.id} style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
                {i !== history.length - 1 && (
                  <div style={{ position: "absolute", left: "15px", top: "30px", bottom: "-1rem", width: "2px", background: "rgba(255,255,255,0.1)" }} />
                )}
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                  {h.toStatus === "REJECTED" ? "❌" : h.toStatus === "HIRED" ? "🎉" : "➡️"}
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", flexGrow: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong>{h.fromStatus} → {h.toStatus}</strong>
                    <span className="text-muted text-sm">{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    {h.remarks && <p>Remarks: {h.remarks}</p>}
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
    </div>
  );
}
