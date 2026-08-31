import { useState, useCallback } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { hasPermission } from "../utils/permissions";
import { SearchForm } from "../components/search/SearchForm";
import { CandidateCard } from "../components/search/CandidateCard";
import { searchCandidates, searchByResume, assignCandidate } from "../api/client";
import { showToast } from "../components/common/Toast";
import { generateCandidateReport } from "../utils/generateReport";
import type { CandidateResult, User } from "../types";
import { useAuth } from "../context/AuthContext";
import { listUsers } from "../api/user";
import { useEffect } from "react";

export function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastJobDescription, setLastJobDescription] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecruiters = async () => {
      if (hasPermission(user, "candidate:assign")) {
        try {
          const usersData = await listUsers();
          setRecruiters(usersData.filter(u => u.role?.name === "RECRUITER" || u.role?.name === "TEAM_LEAD"));
        } catch (e) {}
      }
    };
    fetchRecruiters();
  }, [user]);

  const handleAssign = useCallback(async (candidateId: string, recruiterId: string) => {
    try {
      await assignCandidate(candidateId, recruiterId);
      setCandidates(prev => prev.map(c => c.candidateId === candidateId ? { ...c, assignedRecruiterId: recruiterId } : c));
      showToast("success", "Candidate assigned successfully");
    } catch (err: any) {
      showToast("error", err.message || "Failed to assign candidate");
    }
  }, []);

  const handleSearch = useCallback(
    async (jobDescription: string, limit: number, minExperience?: number, maxExperience?: number) => {
      setIsSearching(true);
      setCandidates([]);
      setHasSearched(false);
      setLastJobDescription(jobDescription);

      try {
        const response = await searchCandidates(jobDescription, limit, minExperience, maxExperience);
        setCandidates(response.candidates);
        setHasSearched(true);

        if (response.count > 0) {
          showToast(
            "success",
            `Found ${response.count} matching candidate${response.count === 1 ? "" : "s"}`
          );
        } else {
          showToast("info", "No candidates matched the given job description");
        }
      } catch (err: any) {
        showToast("error", err.message || "Search failed");
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleResumeSearch = useCallback(
    async (file: File, limit: number, minExperience?: number, maxExperience?: number) => {
      setIsSearching(true);
      setCandidates([]);
      setHasSearched(false);
      setLastJobDescription(`Resume: ${file.name}`);

      try {
        const response = await searchByResume(file, limit, minExperience, maxExperience);
        setCandidates(response.candidates);
        setHasSearched(true);

        if (response.count > 0) {
          showToast(
            "success",
            `Found ${response.count} similar profile${response.count === 1 ? "" : "s"}`
          );
        } else {
          showToast("info", "No similar profiles found for the uploaded resume");
        }
      } catch (err: any) {
        showToast("error", err.message || "Resume search failed");
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  return (
    <>
      <PageHeader
        icon="🔍"
        title="Search Candidates"
        description="Find candidates by matching a job description or resume against indexed profiles"
      />
      <div className="page-body">
        <SearchForm
          onSearch={handleSearch}
          onResumeSearch={handleResumeSearch}
          isSearching={isSearching}
        />

        {/* Results */}
        {hasSearched && candidates.length > 0 && (
          <>
            <div className="search-results-header">
              <h2>Matched Candidates</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="search-results-count">
                  {candidates.length} result{candidates.length === 1 ? "" : "s"}
                </span>
                <button
                  className="report-btn"
                  onClick={() => generateCandidateReport(candidates, lastJobDescription)}
                  title="Download full PDF report for all matched candidates"
                >
                  📄 Download Report
                </button>
              </div>
            </div>
            <div className="search-results-grid">
              {candidates.map((c, i) => (
                <CandidateCard
                  key={c.candidateId}
                  candidate={c}
                  index={i}
                  recruiters={recruiters}
                  onAssign={handleAssign}
                  canAssign={hasPermission(user, "candidate:assign")}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {hasSearched && candidates.length === 0 && !isSearching && (
          <div className="empty-state">
            <span className="empty-state-icon">🔭</span>
            <h3>No candidates found</h3>
            <p>
              Try broadening your job description or uploading more resumes
              to build the candidate index.
            </p>
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !isSearching && (
          <div className="empty-state">
            <span className="empty-state-icon">✨</span>
            <h3>Semantic Candidate Search</h3>
            <p>
              Enter a job description or upload a resume above to find
              semantically matching candidates from the indexed pool.
            </p>
          </div>
        )}

        {isSearching && (
          <div className="search-results-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="candidate-card skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton-ring"></div>
                  <div className="skeleton-info">
                    <div className="skeleton-line title"></div>
                    <div className="skeleton-line subtitle"></div>
                    <div className="skeleton-line details"></div>
                  </div>
                </div>
                <div className="skeleton-body">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
