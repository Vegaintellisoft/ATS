import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/layout/PageHeader";
import { toast } from "../components/common/Toast";
import {
  getDashboardSummary,
  getDashboardManagers,
  
  getDashboardActivity,
} from "../api/dashboard";
import type { DashboardSummary, ManagerStats, ActivityItem, CandidateStatus } from "../types";
import { STATUS_COLORS } from "../types";

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === "ADMIN";

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [managers, setManagers] = useState<ManagerStats[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const summaryData = await getDashboardSummary();
      setSummary(summaryData);

      const activityData = await getDashboardActivity(10);
      setActivity(activityData);

      if (isAdmin) {
        const managersData = await getDashboardManagers();
        setManagers(managersData);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CandidateStatus) => {
    return STATUS_COLORS[status] || "#cbd5e1";
  };

  if (loading) {
    return (
      <div className="page-body">
        <div className="status-indicator processing">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        icon="📊"
        title="Dashboard"
        description={isAdmin ? "Platform overview and statistics." : "Your candidate pipeline overview."}
      />
      <div className="page-body">
        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="stat-card" style={{ padding: "1.5rem", background: "#10B76E", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.875rem", color: "#ffff", marginBottom: "0.5rem" }}>Active Accounts</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color:"#ffff" }}>{summary?.activeAccounts || 0}</div>
          </div>
          <div className="stat-card" style={{ padding: "1.5rem", background: "#F26913", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.875rem", color: "#ffff", marginBottom: "0.5rem" }}>Active Requirements</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold",color:"#ffff" }}>{summary?.activeRequirements || 0}</div>
          </div>
          <div className="stat-card" style={{ padding: "1.5rem", background: "#38A6C3", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.875rem", color: "#ffff", marginBottom: "0.5rem" }}>Open Positions</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold",color:"#ffff" }}>{summary?.openPositions || 0}</div>
          </div>
          <div className="stat-card" style={{ padding: "1.5rem", background: "#D9AF32", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.875rem", color: "#ffff", marginBottom: "0.5rem" }}>Total Candidates</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold",color:"#ffff" }}>{summary?.totalCandidates || 0}</div>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div style={{ marginBottom: "2rem", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <h3 style={{ marginBottom: "1.5rem" }}>Recruitment Funnel</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px", margin: "0 auto" }}>
            {[
              { label: "Candidates (New)", key: "NEW", count: summary?.funnelBreakdown?.NEW || 0 },
              { label: "Screening", key: "SCREENING", count: summary?.funnelBreakdown?.SCREENING || 0 },
              { label: "Shortlisted", key: "SHORTLISTED", count: summary?.funnelBreakdown?.SHORTLISTED || 0 },
              { label: "Interview", key: "INTERVIEW", count: summary?.funnelBreakdown?.INTERVIEW || 0 },
              { label: "Selected", key: "SELECTED", count: summary?.funnelBreakdown?.SELECTED || 0 },
              { label: "Hired", key: "HIRED", count: summary?.funnelBreakdown?.HIRED || 0 },
            ].map((stage) => {
              const maxCount = Math.max(1, (summary?.funnelBreakdown?.NEW || 0));
              const width = Math.max(15, (stage.count / maxCount) * 100);
              
              return (
                <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "140px", textAlign: "right", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    {stage.label}
                  </div>
                  <div style={{ flexGrow: 1, background: "rgba(0,0,0,0.2)", height: "30px", borderRadius: "15px", overflow: "hidden", display: "flex", alignItems: "center" }}>
                    <div style={{ 
                      width: `${width}%`, 
                      height: "100%", 
                      background: getStatusColor(stage.key as CandidateStatus),
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                  <div style={{ width: "40px", fontWeight: "bold", fontSize: "1.1rem" }}>
                    {stage.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr", gap: "2rem" }}>
          {/* Recent Activity */}
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Recent Activity</h3>
            {activity.length === 0 ? (
              <div className="empty-state">No recent activity.</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Performed By</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium text-heading">
                          {item.action.replace(/_/g, " ")}
                        </td>
                        <td>
                          {item.entityType}
                        </td>
                        <td>{item.performedBy}</td>
                        <td className="text-muted text-sm">{new Date(item.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin specific panels */}
          {isAdmin && (
            <div>
              <h3 style={{ marginBottom: "1rem" }}>Top Managers</h3>
              {managers.length === 0 ? (
                <div className="empty-state">No managers found.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Manager</th>
                        <th>Team</th>
                        <th>Candidates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managers.slice(0, 5).map((m) => (
                        <tr key={m.id}>
                          <td className="font-medium text-heading">
                            {m.name || m.email}
                            <div className="text-muted text-sm font-mono">{m.email}</div>
                          </td>
                          <td>{m.teamName || "-"}</td>
                          <td>{m.candidateCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
