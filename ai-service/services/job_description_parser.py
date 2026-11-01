import logging
from parsers.rule_parser import extract_skills
from parsers.gemini_parser import parse_job_description
from models.search_query import SearchQuery

logger = logging.getLogger(__name__)


async def parse(text: str) -> SearchQuery:
    llm = await parse_job_description(text)

    # Merge rule-extracted skills into requiredSkills (deduped)
    rule_skills = extract_skills(text)
    current_skills = llm.requiredSkills or []
    merged = list(dict.fromkeys(current_skills + rule_skills))
    llm.requiredSkills = merged
    
    return llm
