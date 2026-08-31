import type { CandidateResult } from "../types";

function scoreBar(score: number): string {
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? "#10B981" : score >= 0.6 ? "#F59E0B" : "#EF4444";
  return `
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="flex:1;height:6px;background:#E5E7EB;border-radius:99px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;"></div>
      </div>
      <span style="font-size:12px;font-weight:600;color:${color};min-width:32px;">${pct}%</span>
    </div>`;
}

function rankBadge(score: number): string {
  if (score >= 0.8) return `<span style="background:#D1FAE5;color:#065F46;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.04em;">EXCELLENT</span>`;
  if (score >= 0.6) return `<span style="background:#FEF3C7;color:#92400E;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.04em;">STRONG</span>`;
  return `<span style="background:#FEE2E2;color:#991B1B;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.04em;">MODERATE</span>`;
}

function skillChips(skills: string[], type: "matched" | "missing" | "neutral"): string {
  if (!skills || skills.length === 0) return `<span style="color:#9CA3AF;font-size:12px;">None</span>`;
  const colors = {
    matched: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
    missing:  { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
    neutral:  { bg: "#EFF6FF", text: "#1E40AF", border: "#93C5FD" },
  };
  const c = colors[type];
  const prefix = type === "matched" ? "✔ " : type === "missing" ? "⚠ " : "";
  return skills.map(s =>
    `<span style="display:inline-block;background:${c.bg};color:${c.text};border:1px solid ${c.border};border-radius:99px;padding:2px 9px;font-size:11px;font-weight:500;margin:2px 2px;">${prefix}${s}</span>`
  ).join("");
}

function candidateSection(c: CandidateResult, rank: number): string {
  const pct = Math.round(c.finalScore * 100);
  const scoreColor = c.finalScore >= 0.8 ? "#10B981" : c.finalScore >= 0.6 ? "#F59E0B" : "#EF4444";

  return `
  <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:24px;overflow:hidden;page-break-inside:avoid;">
    <!-- Card Header -->
    <div style="background:linear-gradient(135deg,#F9FAFB 0%,#F3F4F6 100%);padding:20px 24px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:20px;">
      <!-- Rank -->
      <div style="width:36px;height:36px;border-radius:50%;background:#4F46E5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">#${rank}</div>
      <!-- Name & Role -->
      <div style="flex:1;">
        <div style="font-size:18px;font-weight:700;color:#111827;">${c.metadata.name || c.candidateId}</div>
        <div style="font-size:13px;color:#6B7280;margin-top:2px;">
          ${c.metadata.role ? `<span>${c.metadata.role}</span>` : ""}
          ${c.metadata.location ? `<span style="margin-left:10px;">📍 ${c.metadata.location}</span>` : ""}
        </div>
      </div>
      <!-- Score Circle -->
      <div style="text-align:center;">
        <div style="font-size:28px;font-weight:800;color:${scoreColor};">${pct}%</div>
        <div style="margin-top:4px;">${rankBadge(c.finalScore)}</div>
      </div>
    </div>

    <!-- Score Breakdown -->
    <div style="padding:20px 24px;">
      <div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Score Breakdown</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:140px;font-size:12px;color:#374151;padding:4px 0;">Overall Match</td>
          <td>${scoreBar(c.finalScore)}</td>
          <td style="width:60px;font-size:11px;color:#6B7280;text-align:right;">Weight: 100%</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#374151;padding:4px 0;">Semantic</td>
          <td>${scoreBar(c.semanticScore)}</td>
          <td style="font-size:11px;color:#6B7280;text-align:right;">35%</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#374151;padding:4px 0;">Skill Match</td>
          <td>${scoreBar(c.skillScore)}</td>
          <td style="font-size:11px;color:#6B7280;text-align:right;">35%</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#374151;padding:4px 0;">Title Match</td>
          <td>${scoreBar(c.titleScore)}</td>
          <td style="font-size:11px;color:#6B7280;text-align:right;">15%</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#374151;padding:4px 0;">Experience</td>
          <td>${scoreBar(c.experienceScore)}</td>
          <td style="font-size:11px;color:#6B7280;text-align:right;">10%</td>
        </tr>
      </table>
    </div>

    <!-- Skills -->
    <div style="padding:0 24px 20px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">✔ Matched Skills</div>
        <div>${skillChips(c.matchedSkills, "matched")}</div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">⚠ Missing Skills</div>
        <div>${skillChips(c.missingSkills, "missing")}</div>
      </div>
    </div>

    <!-- AI Explanation -->
    ${c.explanation ? `
    <div style="margin:0 24px 20px;padding:12px 16px;background:#EEF2FF;border-left:3px solid #4F46E5;border-radius:0 8px 8px 0;">
      <div style="font-size:11px;font-weight:700;color:#4F46E5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Why Selected</div>
      ${c.explanation.split('\n').map(l => `<div style="font-size:13px;color:#3730A3;line-height:1.5;">${l}</div>`).join('')}
    </div>` : ""}
  </div>`;
}

export function generateCandidateReport(
  candidates: CandidateResult[],
  jobDescription: string
): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { dateStyle: "long" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Summary stats
  const avgScore = candidates.length
    ? Math.round((candidates.reduce((s, c) => s + c.finalScore, 0) / candidates.length) * 100)
    : 0;
  const excellent = candidates.filter(c => c.finalScore >= 0.8).length;
  const strong = candidates.filter(c => c.finalScore >= 0.6 && c.finalScore < 0.8).length;
  const moderate = candidates.filter(c => c.finalScore < 0.6).length;

  const jdPreview = jobDescription.length > 600
    ? jobDescription.slice(0, 600) + "…"
    : jobDescription;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>ATS Candidate Report — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',system-ui,sans-serif; background:#F9FAFB; color:#111827; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @media print {
      body { background:#fff; }
      .no-print { display:none !important; }
      @page { margin: 18mm 16mm; size: A4; }
    }
  </style>
</head>
<body>
  <!-- Print Button -->
  <div class="no-print" style="position:fixed;top:20px;right:24px;z-index:999;display:flex;gap:10px;">
    <button onclick="window.print()" style="background:#4F46E5;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,.3);">
      ⬇ Download as PDF
    </button>
    <button onclick="window.close()" style="background:#F3F4F6;color:#374151;border:1px solid #D1D5DB;padding:10px 20px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;">
      ✕ Close
    </button>
  </div>

  <div style="max-width:860px;margin:0 auto;padding:40px 24px 64px;">

    <!-- Report Header -->
    <div style="background:linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%);border-radius:16px;padding:36px 40px;color:#fff;margin-bottom:32px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;">
        <div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.1em;opacity:.75;text-transform:uppercase;margin-bottom:8px;">Applicant Tracking System</div>
          <h1 style="font-size:28px;font-weight:800;line-height:1.2;margin-bottom:6px;">Candidate Evaluation Report</h1>
          <div style="font-size:14px;opacity:.8;">${dateStr} at ${timeStr}</div>
        </div>
        <div style="background:rgba(255,255,255,.15);border-radius:12px;padding:16px 24px;text-align:center;flex-shrink:0;">
          <div style="font-size:36px;font-weight:800;">${candidates.length}</div>
          <div style="font-size:12px;opacity:.8;font-weight:500;">Candidates</div>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;">
      ${[
        { label: "Avg. Score", value: avgScore + "%", color: "#4F46E5" },
        { label: "Excellent ≥80%", value: excellent, color: "#10B981" },
        { label: "Strong 60–79%", value: strong, color: "#F59E0B" },
        { label: "Moderate <60%", value: moderate, color: "#EF4444" },
      ].map(s => `
        <div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:${s.color};">${s.value}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:4px;font-weight:500;">${s.label}</div>
        </div>`).join("")}
    </div>

    <!-- Job Description -->
    <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <div style="font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Job Description Used</div>
      <div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${jdPreview}</div>
    </div>

    <!-- Scoring Methodology -->
    <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:12px;padding:16px 24px;margin-bottom:28px;">
      <div style="font-size:12px;font-weight:700;color:#4338CA;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Scoring Methodology</div>
      <div style="font-size:12px;color:#3730A3;line-height:1.6;">
        Each candidate is ranked using a weighted composite score:
        <strong>Semantic match (35%)</strong> — how closely the resume's meaning matches the job description using AI embeddings;
        <strong>Skill match (35%)</strong> — exact skills required vs. skills on the resume;
        <strong>Title match (15%)</strong> — required skills appearing in past job titles;
        <strong>Experience boost (10%)</strong> — required skills found anywhere in work history;
        <strong>Education (5%)</strong> — reserved for future use.
      </div>
    </div>

    <!-- Divider -->
    <div style="font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
      <span>Candidate Profiles — Ranked by Match Score</span>
      <div style="flex:1;height:1px;background:#E5E7EB;"></div>
    </div>

    <!-- Candidate Cards -->
    ${candidates.map((c, i) => candidateSection(c, i + 1)).join("")}

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:11px;color:#9CA3AF;">Generated by ATS · Semantic Candidate Matching</div>
      <div style="font-size:11px;color:#9CA3AF;">${dateStr}</div>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup blocked — please allow popups for this page and try again.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
