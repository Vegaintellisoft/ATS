import { CandidateRanking, SearchQuery, SemanticCandidate } from "../types/ranking.js";
import { RankingConfig } from "./ranking-config.js";
import { SkillMatcher } from "../matchers/skill-matcher.js";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ScoreCalculator {
  private skillMatcher: SkillMatcher;

  constructor() {
    this.skillMatcher = new SkillMatcher();
  }

  public calculate(
    candidate: SemanticCandidate,
    profile: any,
    query: SearchQuery
  ): CandidateRanking {
    const candidateSkills = profile?.metadata?.skills || profile?.candidate?.skills || candidate.metadata?.skills || [];
    const allRequiredSkills = query.requiredSkills || [];

    // 1. Skill Score using Skill Matcher
    const skillMatch = this.skillMatcher.match(allRequiredSkills, candidateSkills);

    // 2. Title matching — compare jobTitle against candidate's past role titles
    let titleScore = 0;
    if (query.jobTitle) {
      const expTitles = (profile?.experience?.map((e: any) => e.title) || []).join(" ").toLowerCase();
      const jobTitleWords = query.jobTitle.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      
      let titleMatches = 0;
      for (const word of jobTitleWords) {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
        if (regex.test(expTitles)) {
          titleMatches++;
        }
      }
      titleScore = jobTitleWords.length > 0 ? Math.min(titleMatches / jobTitleWords.length, 1.0) : 0;
    }

    // 3. Experience score — compare required range against candidate's actual years
    let experienceScore = 0;
    const candidateExpYears = profile?.computed?.totalExperienceYears 
      ?? candidate.metadata?.totalExperienceYears 
      ?? null;

    if (query.experience && candidateExpYears !== null && candidateExpYears !== undefined) {
      const reqMin = query.experience.min ?? 0;
      const reqMax = query.experience.max ?? Infinity;

      if (candidateExpYears >= reqMin && candidateExpYears <= reqMax) {
        experienceScore = 1.0; // Perfect fit
      } else if (candidateExpYears >= reqMin) {
        // Over-experienced — still good but slight penalty
        const overshoot = candidateExpYears - reqMax;
        experienceScore = Math.max(0.6, 1.0 - (overshoot * 0.05));
      } else {
        // Under-experienced
        const gap = reqMin - candidateExpYears;
        experienceScore = Math.max(0.0, 1.0 - (gap * 0.15));
      }
    } else if (query.experience?.min && candidateExpYears === null) {
      experienceScore = 0.3; // Can't determine — neutral-low
    }

    const educationScore = 0; // Not implemented yet

    // 4. Final Score Calculation
    const semanticScore = candidate.score;
    const finalScore = 
      (semanticScore * RankingConfig.semanticWeight) +
      (skillMatch.score * RankingConfig.skillWeight) +
      (titleScore * RankingConfig.titleWeight) +
      (experienceScore * RankingConfig.experienceWeight) +
      (educationScore * RankingConfig.educationWeight);

    // 5. Explanation Builder
    const explanation = this.buildExplanation(
      finalScore, skillMatch, titleScore, experienceScore,
      query, candidateExpYears
    );

    return {
      candidateId: candidate.candidateId,
      semanticScore,
      skillScore: skillMatch.score,
      titleScore,
      experienceScore,
      educationScore,
      finalScore,
      explanation: explanation.trim(),
      matchedSkills: skillMatch.matched,
      missingSkills: skillMatch.missing,
      candidateExperienceYears: candidateExpYears,
      requiredExperience: query.experience || null,
      metadata: {
        name: profile?.candidate?.name || candidate.metadata?.name,
        role: profile?.experience?.[0]?.title || candidate.metadata?.role,
        location: profile?.candidate?.location || candidate.metadata?.location,
        skills: candidateSkills
      }
    };
  }

  private buildExplanation(
    finalScore: number,
    skillMatch: { matched: string[]; missing: string[]; score: number },
    titleScore: number,
    experienceScore: number,
    query: SearchQuery,
    candidateExpYears: number | null
  ): string {
    const lines: string[] = [];

    // Overall match level
    if (finalScore >= 0.8) {
      lines.push("Excellent match.");
    } else if (finalScore >= 0.6) {
      lines.push("Strong match.");
    } else if (finalScore >= 0.4) {
      lines.push("Moderate match.");
    } else {
      lines.push("Partial match.");
    }

    // Skill breakdown
    const totalRequired = (query.requiredSkills || []).length;
    if (totalRequired > 0) {
      lines.push(`✔ Matches ${skillMatch.matched.length} of ${totalRequired} required skills.`);
    }

    if (skillMatch.missing.length > 0) {
      lines.push(`✗ Missing: ${skillMatch.missing.slice(0, 5).join(", ")}${skillMatch.missing.length > 5 ? ` (+${skillMatch.missing.length - 5} more)` : ""}`);
    }

    // Title match
    if (query.jobTitle && titleScore > 0) {
      lines.push(`✔ Has relevant experience as ${query.jobTitle}.`);
    }

    // Experience comparison
    if (query.experience?.min != null && candidateExpYears != null) {
      const reqMin = query.experience.min;
      const reqMax = query.experience.max;
      const reqStr = reqMax ? `${reqMin}–${reqMax} yrs` : `${reqMin}+ yrs`;
      
      if (candidateExpYears >= reqMin) {
        lines.push(`✔ Experience: ${candidateExpYears.toFixed(1)} yrs (required: ${reqStr}).`);
      } else {
        lines.push(`⚠ Experience: ${candidateExpYears.toFixed(1)} yrs (required: ${reqStr}).`);
      }
    }

    // Recommendation
    if (finalScore >= 0.7 && skillMatch.missing.length <= 2) {
      lines.push("Recommendation: Strong technical match. Consider for interview.");
    } else if (finalScore >= 0.5) {
      lines.push("Recommendation: Partial fit. Review profile for transferable skills.");
    }

    return lines.join("\n");
  }
}
