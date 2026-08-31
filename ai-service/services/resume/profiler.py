import json

from services.llm import GeminiProvider


provider = GeminiProvider()


async def profile_resume(text: str) -> dict:
    prompt = f"""
You are a strict resume data extraction service.

Your task is DATA EXTRACTION, not resume improvement, rewriting,
summarization, correction, classification, or interpretation.

STRICT EXTRACTION RULES:

1. Extract only information explicitly written in the resume.
2. Copy factual field values exactly as written in the resume.
3. Do not rename, normalize, expand, shorten, correct, or paraphrase:
   - candidate names
   - job titles
   - company names
   - institution names
   - degree names
   - locations
   - project names
   - skill names
   - technologies
4. Do not infer relationships between institutions, universities,
   companies, projects, or locations.
5. Do not replace a college name with its affiliated university.
6. Do not convert a job title into a more descriptive or standardized title.
7. Do not remove legal/company suffixes such as Pvt. Ltd., Ltd., Inc., or LLC.
8. Preserve dates exactly as written in the resume.
9. Preserve skills exactly as written, including qualifiers such as
   "(Learning)", "(Beginner)", or "(Advanced)".
10. Description items must preserve the original meaning and factual claims.
11. Do not add information from general knowledge.
12. If a scalar value is not explicitly present, return null.
13. If a collection is not explicitly present, return an empty array.
14. Never guess.
15. If the resume contains a section that does not match any predefined schema,
store it inside "otherSections".

Never discard resume information.
Return valid JSON only.
Do not return markdown.
Do not return explanations.
Do not wrap the JSON in code fences.

Required JSON schema:
{{
  "candidate": {{
    "name": null,
    "email": null,
    "phone": null,
    "location": null,
    "links": []
  }},

  "summary": null,

  "experience": [
    {{
      "organization": null,
      "title": null,
      "location": null,
      "startDate": null,
      "endDate": null,
      "description": []
    }}
  ],

  "education": [
    {{
      "institution": null,
      "qualification": null,
      "fieldOfStudy": null,
      "location": null,
      "startDate": null,
      "endDate": null
    }}
  ],

  "skills": [],

  "certifications": [
    {{
      "name": null,
      "issuer": null,
      "date": null
    }}
  ],

  "licenses": [
    {{
      "name": null,
      "issuer": null,
      "number": null,
      "expiry": null
    }}
  ],

  "languages": [],

  "achievements": [],

  "projects": [
    {{
      "name": null,
      "description": [],
      "skills": []
    }}
  ],

  "publications": [
    {{
      "title": null,
      "publisher": null,
      "year": null
    }}
  ],

  "awards": [
    {{
      "title": null,
      "issuer": null,
      "year": null
    }}
  ],

  "volunteerExperience": [
    {{
      "organization": null,
      "role": null,
      "description": []
    }}
  ],

  "otherSections": [
    {{
      "title": null,
      "content": []
    }}
  ]
}}

RESUME START
--------------------
{text}
--------------------
RESUME END
"""

    response = await provider.generate(prompt)

    cleaned_response = response.strip()

    if cleaned_response.startswith("```json"):
        cleaned_response = cleaned_response[7:]

    if cleaned_response.endswith("```"):
        cleaned_response = cleaned_response[:-3]

    return json.loads(cleaned_response.strip())
