import { CandidateRanking, SemanticCandidate } from "../types/ranking.js";
import { ScoreCalculator } from "./score-calculator.js";

export class RankingEngine {
  private scoreCalculator: ScoreCalculator;

  constructor() {
    this.scoreCalculator = new ScoreCalculator();
  }

  public rank(
    semanticCandidates: SemanticCandidate[],
    profileMap: Map<string, any>,
    query: import("../types/ranking.js").SearchQuery
  ): CandidateRanking[] {
    
    const rankedCandidates: CandidateRanking[] = [];

    for (const candidate of semanticCandidates) {
      const profile = profileMap.get(candidate.candidateId);
      if (profile) {
        const ranking = this.scoreCalculator.calculate(candidate, profile, query);
        rankedCandidates.push(ranking);
      }
    }

    // Sorter logic
    rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);

    return rankedCandidates;
  }
}
