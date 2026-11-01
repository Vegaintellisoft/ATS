import logging
from services.llm.gemini import GeminiProvider
from models.search_query import SearchQuery

logger = logging.getLogger(__name__)


async def parse_job_description(text: str) -> SearchQuery:
    gemini = GeminiProvider()
    
    prompt = f"""You are an expert technical recruiter and talent acquisition specialist.
Analyze the following Job Description and extract structured search criteria:
- jobTitle: extract the official or implied job title
- domain: the technical domain/industry
- requiredSkills: explicitly required technical skills, tools, methodologies, and frameworks
- preferredSkills: nice-to-have or bonus skills
- experience: min and max years of experience required (extract numeric floats or ints; e.g. min 8, max 12)
- education: required education level or degree
- certifications: any professional certifications mentioned (e.g. Six Sigma, ISO)
- keywords: key industry terms and concepts

Job Description:
{text}
"""
    try:
        result = await gemini.generate_structured(prompt, SearchQuery)
        return result
    except Exception as e:
        logger.error(f"Failed to parse JD with Gemini: {e}")
        return SearchQuery()
