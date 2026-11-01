import axios from "axios";
import { CandidateSearchProvider, SemanticCandidate, SearchQuery } from "../types/ranking.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

interface CachedJD {
  result: SearchQuery;
  expiresAt: number;
}

export class AISearchProvider implements CandidateSearchProvider {
  // In-memory cache for parsed JDs (TTL: 1 hour, up to 100 entries)
  private jdCache = new Map<string, CachedJD>();

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
        },
        { timeout: 15000 }
      );
      
      return response.data.candidates || [];
    } catch (error: any) {
      console.error("AI Search Provider error:", error.response?.data || error.message);
      throw new Error("Failed to perform semantic search");
    }
  }
  
  public async parseJobDescription(query: string): Promise<SearchQuery> {
    const cacheKey = query.trim().toLowerCase();
    const cached = this.jdCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/parse-job-description`,
        {
          jobDescription: query
        },
        { timeout: 30000 }
      );
      
      const data = response.data;

      const parsed: SearchQuery = {
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

      // Only cache valid parsed results with skills extracted
      if (parsed.requiredSkills && parsed.requiredSkills.length > 0) {
        if (this.jdCache.size > 100) {
          const oldestKey = this.jdCache.keys().next().value;
          if (oldestKey) this.jdCache.delete(oldestKey);
        }

        this.jdCache.set(cacheKey, {
          result: parsed,
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        });
      }

      return parsed;
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
