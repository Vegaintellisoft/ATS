import axios from "axios";
import { CandidateSearchProvider, SemanticCandidate, SearchQuery } from "../types/ranking.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export class AISearchProvider implements CandidateSearchProvider {
  public async semanticSearch(query: string, limit: number = 10, minExperience?: number, maxExperience?: number, organizationId?: string | null): Promise<SemanticCandidate[]> {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/search-candidates`,
        {
          jobDescription: query,
          limit,
          minExperience,
          maxExperience,
          organizationId,
        }
      );
      
      return response.data.candidates || [];
    } catch (error: any) {
      console.error("AI Search Provider error:", error.response?.data || error.message);
      throw new Error("Failed to perform semantic search");
    }
  }
  
  public async parseJobDescription(query: string): Promise<SearchQuery> {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/parse-job-description`,
        {
          jobDescription: query
        }
      );
      
      const data = response.data;

      return {
        jobTitle: data.jobTitle || null,
        domain: data.domain || null,
        requiredSkills: data.requiredSkills || [],
        preferredSkills: data.preferredSkills || [],
        experience: data.experience || null,
        education: data.education || null,
        certifications: data.certifications || [],
        keywords: data.keywords || [],
        raw: query,
      };
    } catch (error: any) {
      console.error("AI Parse JD error:", error.response?.data || error.message);
      // Return a minimal query so search can still proceed with semantic results
      return {
        requiredSkills: [],
        preferredSkills: [],
        raw: query,
      };
    }
  }
}
