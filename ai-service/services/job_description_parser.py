from parsers.rule_parser import extract_skills
from parsers.gemini_parser import parse_job_description
from models.search_query import SearchQuery

async def parse(text: str) -> SearchQuery:
    # rule_skills = extract_skills(text)
    llm = await parse_job_description(text)
    # Merge rule-extracted skills into requiredSkills (deduped)
    merged = list(dict.fromkeys(llm.requiredSkills))
    llm.requiredSkills = merged
    print(llm)
    
    return llm
