import { prisma } from "../config/prisma.js";
import { SemanticCandidate } from "../types/ranking.js";

export class CandidateProfileRepository {
  public async getProfiles(semanticCandidates: SemanticCandidate[]): Promise<Map<string, any>> {
    const candidateIds = semanticCandidates.map(c => c.candidateId);
    
    if (candidateIds.length === 0) {
      return new Map();
    }

    const profiles = await prisma.candidateProfile.findMany({
      where: { id: { in: candidateIds } }
    });
    
    return new Map(profiles.map((p: any) => [
      p.id,
      {
        ...(typeof p.profile === "object" ? p.profile : {}),
        skills: p.profile?.skills || [],
        totalExperienceYears: p.totalExperienceYears ?? p.profile?.computed?.totalExperienceYears ?? null,
      }
    ]));
  }
}
