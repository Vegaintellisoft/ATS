import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/layout/PageHeader";
import { toast } from "../components/common/Toast";
import {
  getAccountReport,
  getRequirementReport,
  getRecruiterReport,
  getManagerReport,
  downloadReport,
} from "../api/reports";

type ReportTab = "ACCOUNT" | "REQUIREMENT" | "RECRUITER" | "MANAGER";

export function ReportsPage() {
  const { user } = useAuth();
  const isManager = ["ADMIN", "TEAM_MANAGER"].includes(user?.role?.name || "");

  const [activeTab, setActiveTab] = useState<ReportTab>("REQUIREMENT");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab: ReportTab) => {
    try {
      setLoading(true);
      setData([]);
      
      let result = [];
      if (tab === "ACCOUNT") {
        result = await getAccountReport();
      } else if (tab === "REQUIREMENT") {
        result = await getRequirementReport();
      } else if (tab === "RECRUITER") {
        result = await getRecruiterReport();
      } else if (tab === "MANAGER") {
        result = await getManagerReport();
      }
      
      setData(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (loading) {
      return <div className="p-8 text-center text-muted">Generating report...</div>;
    }
    
    if (data.length === 0) {
      return <div className="p-8 text-center text-muted">No data available for this report.</div>;
    }

    // Determine columns dynamically from first row
    const columns = Object.keys(data[0]);

    return (
      <div className="table-container" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                if (col.endsWith("Id")) return null; // hide IDs
                return (
                  <th key={col}>
                    {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => {
                  if (col.endsWith("Id")) return null;
                  let val = row[col];
                  if (col.includes("Rate") && typeof val === "number") {
                    val = `${val}%`;
                  }
                  return (
                    <td key={col} className={typeof val === "number" ? "text-right font-medium" : ""}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        icon="📈"
        title="Business Reports"
        description="View and analyze recruitment pipeline metrics."
      />
      
      <div className="page-body">
        <div className="tab-container" style={{ marginBottom: "1rem" }}>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "REQUIREMENT" ? "active" : ""}`}
              onClick={() => setActiveTab("REQUIREMENT")}
            >
              Requirements
            </button>
            <button
              className={`tab ${activeTab === "ACCOUNT" ? "active" : ""}`}
              onClick={() => setActiveTab("ACCOUNT")}
            >
              Accounts
            </button>
            <button
              className={`tab ${activeTab === "RECRUITER" ? "active" : ""}`}
              onClick={() => setActiveTab("RECRUITER")}
            >
              Recruiters
            </button>
            {isManager && (
              <button
                className={`tab ${activeTab === "MANAGER" ? "active" : ""}`}
                onClick={() => setActiveTab("MANAGER")}
              >
                Managers
              </button>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>
              {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Report
            </h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                className="btn-secondary" 
                onClick={() => downloadReport(activeTab.toLowerCase() as any)}
                disabled={loading || data.length === 0}
              >
                📥 Export CSV
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => fetchData(activeTab)}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
          
          {renderTable()}
        </div>
      </div>
    </>
  );
}
