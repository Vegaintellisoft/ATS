import re

TECH_SKILLS = {
    "react": ["react", "reactjs", "react.js"],
    "node.js": ["node", "node.js", "nodejs"],
    "docker": ["docker"],
    "postgresql": ["postgres", "postgresql", "pgsql"],
    "redis": ["redis"],
    "python": ["python"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
}

def extract_skills(text: str) -> list[str]:
    text = text.lower()
    skills = []
    for canonical, aliases in TECH_SKILLS.items():
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias)}\b", text):
                skills.append(canonical)
                break
    return skills
