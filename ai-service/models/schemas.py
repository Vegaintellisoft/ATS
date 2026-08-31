# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class ParseResumeRequest(BaseModel):
    objectKey: str


class Candidate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    github: str | None = None
    linkedin: str | None = None
    location: str | None = None


class ParseResumeResponse(BaseModel):
    success: bool
    profile: dict
    rawText: str
    
class CandidateIndexRequest(BaseModel):
    candidateId: str
    profile: dict
    organizationId: str | None = None
    
class CandidateSearchRequest(BaseModel):
    jobDescription: str
    limit: int = 10
    minExperience: float | None = None
    maxExperience: float | None = None
    organizationId: str | None = None

class ParseJDRequest(BaseModel):
    jobDescription: str

class ParseJDResponse(BaseModel):
    success: bool
    title: str | None = None
    domain: str | None = None
    skills: list[str] = []