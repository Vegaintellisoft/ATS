import type { CandidateResult, User } from "../../types";

interface CandidateCardProps {
  candidate: CandidateResult;
  index: number;
  recruiters?: User[];
  onAssign?: (candidateId: string, recruiterId: string) => void;
  canAssign?: boolean;
}

export function CandidateCard({ candidate, index, recruiters = [], onAssign, canAssign }: CandidateCardProps) {
  const { candidateId, finalScore, semanticScore, skillScore, matchedSkills, missingSkills, explanation, metadata, assignedRecruiterId } = candidate;
  
  const scoreToUse = finalScore ?? 0;
  const pct = Math.round(scoreToUse * 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (scoreToUse * circumference);

  const scoreClass =
    scoreToUse >= 0.8 ? "score-high" : scoreToUse >= 0.6 ? "score-medium" : "score-low";

  return (
    <article
      className="candidate-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="candidate-card-top">
        {/* Score Ring */}
        <div className="score-ring-wrapper" title="Overall Match">
          <svg className="score-ring" viewBox="0 0 80 80">
            <circle className="score-ring-bg" cx="40" cy="40" r="36" />
            <circle
              className={`score-ring-fill ${scoreClass}`}
              cx="40"
              cy="40"
              r="36"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="score-value">{pct}%</span>
        </div>

        {/* Info */}
        <div className="candidate-card-info">
          <p className="candidate-name" title={metadata.name || candidateId}>
            {metadata.name || `${candidateId.slice(0, 8)}…${candidateId.slice(-4)}`}
          </p>
          {metadata.role && (
            <p className="candidate-role">
              {metadata.role}
            </p>
          )}
          {metadata.location && (
            <p className="candidate-location">
              <span className="candidate-location-icon">📍</span>
              {metadata.location}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <a
              href={`/api/v1/candidates/${candidateId}/resume`}
              target="_blank"
              rel="noopener noreferrer"
              className="candidate-resume-link"
            >
              👁 View
            </a>
            <a
              href={`/api/v1/candidates/${candidateId}/resume?download=true`}
              className="candidate-resume-link"
            >
              ⬇ Download
            </a>
          </div>

          <div style={{ marginTop: '12px' }}>
            {canAssign && onAssign ? (
              <select 
                className="search-input" 
                style={{ padding: "4px", fontSize: "12px", width: "100%", boxSizing: "border-box" }}
                value={assignedRecruiterId || ""}
                onChange={(e) => onAssign(candidateId, e.target.value)}
              >
                <option value="">Unassigned</option>
                {recruiters.map(r => (
                  <option key={r.id} value={r.id}>{r.name || r.email}</option>
                ))}
              </select>
            ) : (
              <span className="text-muted text-sm">
                {assignedRecruiterId ? (recruiters.find(r => r.id === assignedRecruiterId)?.name || "Assigned") : "Unassigned"}
              </span>
            )}
          </div>
        </div>
      </div>
      


      <details className="candidate-details">
        <summary>▼ Details</summary>
        <div className="details-content">
          <p>Semantic Score: {Math.round(semanticScore * 100)}%</p>
          <p>Skill Score: {Math.round(skillScore * 100)}%</p>
          <p>Title Score: {Math.round(candidate.titleScore * 100)}%</p>
          <p>Experience Score: {Math.round(candidate.experienceScore * 100)}%</p>
        </div>
      </details>

      {/* Skills */}
      <div className="candidate-skills-breakdown">
        {matchedSkills?.length > 0 && (
          <div className="skills-section">
            <strong>Strengths:</strong>
            <div className="candidate-skills">
              {matchedSkills.slice(0, 5).map((skill) => (
                <span key={`matched-${skill}`} className="skill-tag skill-matched">
                  ✔ {skill}
                </span>
              ))}
              {matchedSkills.length > 5 && (
                <span className="skill-tag skill-tag-more">+{matchedSkills.length - 5} more</span>
              )}
            </div>
          </div>
        )}
        
        {missingSkills?.length > 0 && (
          <div className="skills-section">
            <strong>Needs:</strong>
            <div className="candidate-skills">
              {missingSkills.slice(0, 5).map((skill) => (
                <span key={`missing-${skill}`} className="skill-tag skill-missing">
                  ⚠ {skill}
                </span>
              ))}
              {missingSkills.length > 5 && (
                <span className="skill-tag skill-tag-more">+{missingSkills.length - 5} more</span>
              )}
            </div>
          </div>
        )}
        
        {(!matchedSkills || matchedSkills.length === 0) && (!missingSkills || missingSkills.length === 0) && metadata.skills?.length > 0 && (
          <div className="candidate-skills">
            {metadata.skills.slice(0, 5).map((skill) => (
              <span key={skill} className="skill-tag">
                {skill}
              </span>
            ))}
            {metadata.skills.length > 5 && (
              <span className="skill-tag skill-tag-more">
                +{metadata.skills.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {explanation && (
        <div className="candidate-explanation">
          {explanation.split('\n').map((line, i) => (
            <p key={i}><small>{line}</small></p>
          ))}
        </div>
      )}
    </article>
  );
}
