import { SearchQuery } from "../types/ranking.js";
import { KNOWN_SKILLS, SkillSynonyms } from "../config/skill-synonyms.js";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class QueryParser {
  public parse(jobDescription: string): SearchQuery {
    const raw = jobDescription || "";
    const lowerRaw = raw.toLowerCase();
    
    const extractedSkills = new Set<string>();

    const checkAndAdd = (term: string, canonical: string) => {
      let regexStr = "";
      if (term === "c#") {
        regexStr = "(^|\\s|\\W)c#(\\W|$)";
      } else if (term === ".net" || term === "asp.net") {
        regexStr = `(^|\\s|\\W)${escapeRegExp(term)}(\\W|$)`;
      } else {
        regexStr = `\\b${escapeRegExp(term)}\\b`;
      }
      
      const regex = new RegExp(regexStr, "i");
      if (regex.test(lowerRaw)) {
        extractedSkills.add(canonical);
      }
    };

    for (const skill of KNOWN_SKILLS) {
      checkAndAdd(skill, skill);
    }
    
    for (const [canonical, synonyms] of Object.entries(SkillSynonyms)) {
      for (const syn of synonyms) {
        checkAndAdd(syn, canonical);
      }
    }

    return {
      requiredSkills: Array.from(extractedSkills),
      preferredSkills: [],
      raw: raw
    };
  }
}
