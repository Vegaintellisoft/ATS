import { SkillSynonyms } from "../config/skill-synonyms.js";

export class SynonymResolver {
  private synonymMap: Map<string, string>;

  constructor() {
    this.synonymMap = new Map();
    
    // Build reverse map: synonym -> standardTerm
    for (const [standard, synonyms] of Object.entries(SkillSynonyms)) {
      this.synonymMap.set(standard.toLowerCase(), standard.toLowerCase());
      for (const syn of synonyms) {
        this.synonymMap.set(syn.toLowerCase(), standard.toLowerCase());
      }
    }
  }

  public resolve(term: string): string {
    const lowerTerm = term.toLowerCase().trim();
    return this.synonymMap.get(lowerTerm) || lowerTerm;
  }
}
