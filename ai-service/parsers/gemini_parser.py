import json
import logging
from services.llm.gemini import GeminiProvider
from models.search_query import SearchQuery

logger = logging.getLogger(__name__)

async def parse_job_description(text: str) -> SearchQuery:
    gemini = GeminiProvider()
    
    prompt = f"""You are an expert recruiter. Analyze the following Job Description and extract structured information.
Return ONLY valid JSON matching this exact schema:

{{
  "jobTitle": "the job title (e.g. Senior React Developer)",
  "domain": "the domain/industry (e.g. Frontend, Backend, DevOps, Data Science)",
  "requiredSkills": ["list of explicitly required technical skills"],
  "preferredSkills": ["list of nice-to-have or preferred skills"],
  "experience": {{
    "min": null,
    "max": null
  }},
  "education": "required education level or null",
  "certifications": ["any required certifications"],
  "keywords": ["important domain keywords for context"],
  "employment_type": "full-time/part-time/contract or null",
  "location": "location or null"
}}

Rules:
- For experience, extract numeric years. "Senior" implies min 4. "Mid" implies min 2. "Junior" implies min 0.
- requiredSkills should contain skills that are explicitly stated as required or mandatory.
- preferredSkills should contain skills that are nice-to-have, preferred, or bonus.
- If the JD doesn't distinguish, put all skills in requiredSkills.
- keywords should include the domain, technologies, and broad terms that describe the role.
- Return null for fields that cannot be determined.

Job Description:
{text}
"""
    
    try:
        response_text = await gemini.generate_json(prompt)
        data = json.loads(response_text)
        return SearchQuery(**data)
    except Exception as e:
        logger.error(f"Failed to parse JD with Gemini: {e}")
        return SearchQuery()
