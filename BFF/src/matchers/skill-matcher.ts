import { SkillMatchResult } from "../types/ranking.js";
import { SynonymResolver } from "./synonym-resolver.js";

export class SkillMatcher {
  private resolver: SynonymResolver;

  constructor() {
    this.resolver = new SynonymResolver();
  }

  public match(requiredSkills: string[], candidateSkills: string[]): SkillMatchResult {
    if (!requiredSkills || requiredSkills.length === 0) {
      return { matched: [], missing: [], score: 0 };
    }

    const normalizedRequired = new Set(requiredSkills.map(s => this.resolver.resolve(s)));
    const normalizedCandidate = new Set((candidateSkills || []).map(s => this.resolver.resolve(s)));

    const matched = new Set<string>();
    const missing = new Set<string>();

    for (const req of normalizedRequired) {
      if (normalizedCandidate.has(req)) {
        matched.add(req);
      } else {
        // Fallback: check if the required skill is a substring of any candidate skill (e.g. "C#" in "C# .NET")
        let found = false;
        for (const cand of normalizedCandidate) {
          if (cand.includes(req) || req.includes(cand)) {
            matched.add(req);
            found = true;
            break;
          }
        }
        if (!found) {
          missing.add(req);
        }
      }
    }

    const score = matched.size / normalizedRequired.size;

    return {
      matched: Array.from(matched),
      missing: Array.from(missing),
      score
    };
  }
}
