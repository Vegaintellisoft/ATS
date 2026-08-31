import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { listCandidates, deleteCandidateById, updateCandidateStatus } from "../api/client";
import { showToast } from "../components/common/Toast";
import type { ListCandidate, CandidateStatus } from "../types";
import { CANDIDATE_STATUSES, STATUS_COLORS } from "../types";
import { useAuth } from "../context/AuthContext";
import { CandidateDetailPage } from "./CandidateDetailPage";

export function ListPage() {
  const [candidates, setCandidates] = useState<ListCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const { user } = useAuth();

  // ── Filter state ──
  const [searchText, setSearchText] = useState("");
  const [filterPipeline, setFilterPipeline] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterUploadedBy, setFilterUploadedBy] = useState<string>("ALL");
  const [filterExpMin, setFilterExpMin] = useState<string>("");
  const [filterExpMax, setFilterExpMax] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  const isAdmin = user?.role?.name === "ADMIN";

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listCandidates();
      setCandidates(response.candidates);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load candidates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // ── Unique "uploaded by" values for the dropdown ──
  const uploaderOptions = useMemo(() => {
    const map = new Map<string, string>();
    candidates.forEach((c) => {
      if (c.createdBy) {
        map.set(c.createdBy.id, c.createdBy.name || c.createdBy.email);
      }
    });
    return Array.from(map.entries()); // [id, displayName][]
  }, [candidates]);

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchText) count++;
    if (filterPipeline !== "ALL") count++;
    if (filterStatus !== "ALL") count++;
    if (filterUploadedBy !== "ALL") count++;
    if (filterExpMin) count++;
    if (filterExpMax) count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [searchText, filterPipeline, filterStatus, filterUploadedBy, filterExpMin, filterExpMax, filterDateFrom, filterDateTo]);

  const clearAllFilters = () => {
    setSearchText("");
    setFilterPipeline("ALL");
    setFilterStatus("ALL");
    setFilterUploadedBy("ALL");
    setFilterExpMin("");
    setFilterExpMax("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // ── Apply filters ──
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const name = (c.profile?.candidate?.name || "").toLowerCase();
      const jobTitle = (c.profile?.experience?.[0]?.title || "").toLowerCase();
      const location = (c.profile?.candidate?.location || "").toLowerCase();
      const uploaderName = (c.createdBy?.name || c.createdBy?.email || "").toLowerCase();
      const query = searchText.toLowerCase().trim();

      // Text search — matches name, job title, location, or uploader
      if (query && !name.includes(query) && !jobTitle.includes(query) && !location.includes(query) && !uploaderName.includes(query)) {
        return false;
      }

      // Pipeline status
      if (filterPipeline !== "ALL" && c.status !== filterPipeline) {
        return false;
      }

      // Document status
      if (filterStatus !== "ALL" && c.document.status !== filterStatus) {
        return false;
      }

      // Uploaded by
      if (filterUploadedBy !== "ALL" && c.createdBy?.id !== filterUploadedBy) {
        return false;
      }

      // Experience range
      if (filterExpMin) {
        const min = parseFloat(filterExpMin);
        if (!isNaN(min) && (c.totalExperienceYears == null || c.totalExperienceYears < min)) {
          return false;
        }
      }
      if (filterExpMax) {
        const max = parseFloat(filterExpMax);
        if (!isNaN(max) && (c.totalExperienceYears == null || c.totalExperienceYears > max)) {
          return false;
        }
      }

      // Date range
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(c.createdAt) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(c.createdAt) > to) return false;
      }

      return true;
    });
  }, [candidates, searchText, filterPipeline, filterStatus, filterUploadedBy, filterExpMin, filterExpMax, filterDateFrom, filterDateTo]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Delete candidate "${name}"? This cannot be undone.`)) {
        return;
      }

      setDeletingId(id);
      try {
        await deleteCandidateById(id);
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        showToast("success", `Candidate "${name}" deleted`);
      } catch (err: any) {
        showToast("error", err.message || "Failed to delete candidate");
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const handleStatusChange = useCallback(async (candidateId: string, newStatus: string) => {
    try {
      await updateCandidateStatus(candidateId, newStatus);
      setCandidates(prev => prev.map(c =>
        c.id === candidateId ? { ...c, status: newStatus as CandidateStatus } : c
      ));
      showToast("success", `Status updated to ${newStatus}`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status");
    }
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {selectedCandidateId && (
        <CandidateDetailPage
          candidateId={selectedCandidateId}
          onBack={() => setSelectedCandidateId(null)}
        />
      )}
      {!selectedCandidateId && (
        <>
        <PageHeader
          icon="👥"
          title={isAdmin ? "All Candidates" : "My Candidates"}
          description={isAdmin
            ? "View all candidate profiles across all team managers."
            : "Candidates you have uploaded and manage."
          }
        />
        <div className="page-body">
        {isLoading ? (
          <LoadingSpinner text="Loading candidate profiles…" />
        ) : candidates.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <h3>No candidates yet</h3>
            <p>Upload some resumes to start building your candidate pool.</p>
          </div>
        ) : (
          <>
            {/* ── Filter Bar ── */}
            <div className="filter-bar">
              <div className="filter-bar-top">
                <div className="filter-search-wrapper">
                  <span className="filter-search-icon">🔍</span>
                  <input
                    type="text"
                    className="filter-search-input"
                    placeholder="Search by name, title, location, or uploader…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  {searchText && (
                    <button className="filter-search-clear" onClick={() => setSearchText("")}>✕</button>
                  )}
                </div>
                <div className="filter-bar-actions">
                  <button
                    className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <span>⚙️</span> Filters
                    {activeFilterCount > 0 && (
                      <span className="filter-count-badge">{activeFilterCount}</span>
                    )}
                  </button>
                  {activeFilterCount > 0 && (
                    <button className="filter-clear-all-btn" onClick={clearAllFilters}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="filter-bar-expanded">
                  <div className="filter-group">
                    <label className="filter-label">Pipeline</label>
                    <select
                      className="filter-select"
                      value={filterPipeline}
                      onChange={(e) => setFilterPipeline(e.target.value)}
                    >
                      <option value="ALL">All Pipelines</option>
                      {CANDIDATE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select
                      className="filter-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PARSED">PARSED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Uploaded By</label>
                    <select
                      className="filter-select"
                      value={filterUploadedBy}
                      onChange={(e) => setFilterUploadedBy(e.target.value)}
                    >
                      <option value="ALL">All Uploaders</option>
                      {uploaderOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Experience (years)</label>
                    <div className="filter-range">
                      <input
                        type="number"
                        className="filter-input-small"
                        placeholder="Min"
                        min="0"
                        step="0.5"
                        value={filterExpMin}
                        onChange={(e) => setFilterExpMin(e.target.value)}
                      />
                      <span className="filter-range-sep">–</span>
                      <input
                        type="number"
                        className="filter-input-small"
                        placeholder="Max"
                        min="0"
                        step="0.5"
                        value={filterExpMax}
                        onChange={(e) => setFilterExpMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Added From</label>
                    <input
                      type="date"
                      className="filter-input-date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Added To</label>
                    <input
                      type="date"
                      className="filter-input-date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Results summary ── */}
              <div className="filter-results-summary">
                Showing <strong>{filteredCandidates.length}</strong> of <strong>{candidates.length}</strong> candidate{candidates.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* ── Table ── */}
            {filteredCandidates.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔎</span>
                <h3>No matching candidates</h3>
                <p>Try adjusting your filters to see more results.</p>
                <button className="filter-clear-all-btn" onClick={clearAllFilters} style={{ marginTop: "12px" }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Job Title</th>
                      <th>Experience</th>
                      <th>Location</th>
                      <th>Source File</th>
                      <th>Status</th>
                      <th>Pipeline</th>
                      <th>Uploaded By</th>
                      <th>Added On</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((c) => {
                      const name = c.profile?.candidate?.name || "Unknown";
                      return (
                        <tr key={c.id}>
                          <td className="font-medium text-heading">
                            <button
                              onClick={() => setSelectedCandidateId(c.id)}
                              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textAlign: "left", fontWeight: 600, textDecoration: "underline dotted", textUnderlineOffset: "3px" }}
                            >
                              {name}
                            </button>
                          </td>
                          <td>{c.profile?.experience?.[0]?.title || "—"}</td>
                          <td>
                            {c.totalExperienceYears != null ? (
                              <span className="status-badge exp-badge">
                                {c.totalExperienceYears} {c.totalExperienceYears === 1 ? 'year' : 'years'}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{c.profile?.candidate?.location || "—"}</td>
                          <td>
                            <span
                              className="font-mono text-muted text-sm"
                              title={c.document.originalName}
                            >
                              {c.document.originalName.length > 25
                                ? c.document.originalName.slice(0, 22) + "..."
                                : c.document.originalName}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${c.document.status.toLowerCase()}`}
                            >
                              {c.document.status}
                            </span>
                          </td>
                          <td>
                            <select
                              className="search-textarea"
                              style={{
                                padding: "4px 8px",
                                minHeight: "30px",
                                fontSize: "0.75rem",
                                minWidth: "120px",
                                background: STATUS_COLORS[c.status] || "#64748b",
                                color: "#fff",
                                borderRadius: "6px",
                                border: "none",
                                fontWeight: 600,
                              }}
                              value={c.status}
                              onChange={(e) => handleStatusChange(c.id, e.target.value)}
                            >
                              {CANDIDATE_STATUSES.map((s) => (
                                <option key={s} value={s} style={{ background: "#1e293b", color: "#fff" }}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-sm">
                            {c.createdBy ? (
                              <span title={c.createdBy.email}>
                                {c.createdBy.name || c.createdBy.email}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-muted text-sm">
                            {formatDate(c.createdAt)}
                          </td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(c.id, name)}
                              disabled={deletingId === c.id}
                              title="Delete candidate"
                            >
                              {deletingId === c.id ? (
                                <span className="spinner-inline" />
                              ) : (
                                "🗑"
                              )}
                            </button>
                          </td>
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
        </>
      )}
    </>
  );
}
