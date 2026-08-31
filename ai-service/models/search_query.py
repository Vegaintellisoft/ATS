from pydantic import BaseModel, Field
from typing import List, Optional


class ExperienceRange(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None


class SearchQuery(BaseModel):
    jobTitle: Optional[str] = None
    domain: Optional[str] = None
    requiredSkills: List[str] = Field(default_factory=list)
    preferredSkills: List[str] = Field(default_factory=list)
    experience: Optional[ExperienceRange] = None
    education: Optional[str] = None
    certifications: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    employment_type: Optional[str] = None
    location: Optional[str] = None

    # Backward compat: expose a flat skills list merging required + preferred
    @property
    def skills(self) -> List[str]:
        return list(dict.fromkeys(self.requiredSkills + self.preferredSkills))

    @skills.setter
    def skills(self, value: List[str]) -> None:
        self.requiredSkills = value
        self.preferredSkills = []
