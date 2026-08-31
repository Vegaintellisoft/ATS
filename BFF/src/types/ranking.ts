export interface ExperienceRange {
  min?: number | null;
  max?: number | null;
}

export interface CandidateRanking {
  candidateId: string;
  semanticScore: number;
  skillScore: number;
  titleScore: number;
  experienceScore: number;
  educationScore: number;
  finalScore: number;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  metadata: any;
  candidateExperienceYears?: number | null;
  requiredExperience?: ExperienceRange | null;
}

export interface SearchQuery {
  jobTitle?: string | null;
  domain?: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  experience?: ExperienceRange | null;
  education?: string | null;
  certifications?: string[];
  keywords?: string[];
  raw: string;
}

export interface SkillMatchResult {
  matched: string[];
  missing: string[];
  score: number;
}

export interface CandidateSearchProvider {
  semanticSearch(query: string, limit?: number, minExperience?: number, maxExperience?: number, organizationId?: string | null): Promise<SemanticCandidate[]>;
}

export interface SemanticCandidate {
  candidateId: string;
  score: number;
  metadata: any;
}
