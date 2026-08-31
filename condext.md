# ATS — Implemented Features Summary & Codebase Map

This document provides a concise overview of the features currently implemented in the Applicant Tracking System (ATS), mapped to the specific files implementing them.

---

## 1. Resume Ingestion & Processing Pipeline
* **Multi-File Upload:** Supports uploading multiple PDF resumes simultaneously via a multipart form-data endpoint (`POST /api/v1/resume-pipeline`).
* **Secure Storage:** Uploaded resumes are stored in MinIO object storage using unique generated object keys while retaining original file names and types.
* **Metadata Persistence:** Stores document metadata (file size, mime type, upload status) in PostgreSQL.
* **Duplicate Detection:** Automatic detection of duplicate candidates based on candidate name and email address:
  * Updates the existing candidate's JSON profile, incrementing the profile version.
  * Deletes the old resume file from MinIO and deletes the old document record from PostgreSQL.
  * Creates a new candidate profile if no duplicate is found.
* **Tracking Uploaders:** Candidates store the `createdById` to track which team member/manager uploaded the resume.
* **Implementing Files:**
  * **Routes:** `BFF/src/routes/resume.routes.ts`
  * **Controller:** `BFF/src/controllers/resume.controller.ts`
  * **Database Schema:** `BFF/prisma/schema.prisma` (`ResumeDocument`, `CandidateProfile`)

---

## 2. Text Extraction & Structured LLM Profiling
* **Raw PDF Parsing:** Extract raw, clean text from PDF documents using PyMuPDF.
* **Factual Structured Profiling:** Utilizes Gemini (`gemini-flash-latest`) to transform raw resume text into a strict, unified JSON schema.
* **Strict Extraction Rules:** Rules to prevent resume rewriting, skill inference, or normalizations. Extracts Candidate Info, Summary, Work Experience, Education, Skills, Certifications, Licenses, Languages, Projects, Publications, Awards, and Volunteer Experience.
* **Implementing Files:**
  * **AI Routes:** `ai-service/api/routes.py`
  * **Orchestration:** `ai-service/services/resume/pipeline.py`
  * **Text Extractor:** `ai-service/services/resume/extractor.py`
  * **LLM Profiler:** `ai-service/services/resume/profiler.py`
  * **Gemini Provider:** `ai-service/services/llm/gemini.py`

---

## 3. Deterministic Experience Metrics Calculation
* **Overlap Merging:** Merges overlapping or adjacent employment timelines to ensure concurrent or multiple active jobs are not double-counted in total experience.
* **Calculated Metrics:** Automatically derives `totalExperienceYears` (rounded to one decimal place), `currentCompany`, `currentDesignation`, `careerGaps`, `careerGapMonths`, `hasOverlappingExperience`, and `totalJobs` count.
* **Implementing Files:**
  * **Experience Service:** `ai-service/services/experience.py`

---

## 4. Semantic Embedding & Vector Storage
* **Index Building:** Generates a dense semantic string per candidate combining their experience roles, descriptions, skills, and projects.
* **Embedding Generation:** Uses the BGE model to generate 384-dimensional vector representations.
* **Vector Indexing:** Stores the vector representation in Qdrant indexed by candidate ID, with payload attributes containing searchable skills, location, and total experience years.
* **Implementing Files:**
  * **AI Routes:** `ai-service/api/routes.py`
  * **Index Builder:** `ai-service/services/candidate/index_builder.py`
  * **Embedding Model:** `ai-service/services/embedding.py`
  * **Qdrant Storage:** `ai-service/services/vector_store.py`

---

## 5. Hybrid Search & Candidate Ranking Engine
* **Job Description Semantic Search:** Matches natural language job descriptions against candidate vectors in Qdrant.
* **Resume-to-Resume Semantic Search:** Accepts a search-by-resume PDF, generates its embedding, and matches it against other candidate profiles.
* **Experience Pre-Filtering:** Filters search results dynamically in Qdrant based on experience criteria (`minExperience`, `maxExperience`).
* **Hybrid Multi-Factor Ranking:** Calculates a combined final score (0.0 to 1.0) on the BFF side using weighted metrics:
  * **Semantic Match (35%)**: Vector similarity from Qdrant.
  * **Skill Match (35%)**: Exact and synonym-based technical skill matching (e.g. mapping `JS` to `JavaScript`, `K8s` to `Kubernetes`).
  * **Title Match (15%)**: String-matching on past job titles using components of the target job title.
  * **Experience Match (10%)**: Compares total years of experience against requested ranges with a mild penalty for over-experience and higher penalty for under-experience.
  * **Education Match (5%)**: *(Placeholder)*.
* **Implementing Files:**
  * **BFF Routes:** `BFF/src/routes/candidate.routes.ts`
  * **BFF Controller:** `BFF/src/controllers/candidate.controller.ts`
  * **AI Search Logic:** `ai-service/services/candidate/search.py`
  * **AI Job Description Parser:** `ai-service/services/job_description_parser.py` & `ai-service/parsers/gemini_parser.py`
  * **BFF Ranking Engine:** `BFF/src/ranking/ranking-engine.ts` & `BFF/src/ranking/score-calculator.ts`
  * **BFF Skill Matcher:** `BFF/src/matchers/skill-matcher.ts`, `BFF/src/matchers/synonym-resolver.ts`, and `BFF/src/config/skill-synonyms.ts`

---

## 6. Security, Identity, & Access Control
* **Authentication:** Uses secure JWT-based stateless user authentication.
* **Role-Based Authorization (RBAC):** Restricts system operations using three primary roles: `ADMIN`, `TEAM_MANAGER`, and `TEAM_MEMBER`.
* **Multi-tenant Organization Architecture:** Data is isolated per organization (though users/candidates can be unassigned for platform-level access). Teams belong to organizations. Users belong to teams.
* **Implementing Files:**
  * **BFF Routes:** `BFF/src/routes/auth.routes.ts`
  * **BFF Controller & Service:** `BFF/src/controllers/auth.controller.ts`, `BFF/src/services/auth.service.ts`
  * **BFF Middleware:** `BFF/src/middlewares/auth.middleware.ts`
  * **JWT Helpers:** `BFF/src/utils/jwt.ts`

---

## 7. Recruiter Web Interface & Dashboard
* **Secure Login:** Dedicated authentication gateway for users.
* **Dashboard:** Summary metrics (candidate counts, pipeline breakdown, manager performance) and recent activity logs. 
* **Candidate Directory (`ListPage`):** Lists all parsed candidates with filtering.
  * Filters available: Global search, Pipeline status, Processing status, Uploaded By, Experience Range, and Added Date.
* **Resume Uploader (`UploadPage`):** Interface for drag-and-drop or file-selector resume ingestion.
* **Matching Workbench (`SearchPage`):** Search workspace displaying ranked candidates alongside visual breakdowns of matching/missing skills, experience metrics, and matching explanations.
* **Admin/Manager Views:** `TeamsPage`, `UsersPage`, and `CreateUserPage` for managing organizational structure and access.
* **Implementing Files:**
  * **App Entry:** `client/src/App.tsx`
  * **Views:** `client/src/pages/` (`LoginPage.tsx`, `DashboardPage.tsx`, `ListPage.tsx`, `UploadPage.tsx`, `SearchPage.tsx`, `TeamsPage.tsx`, `UsersPage.tsx`, `CreateUserPage.tsx`)
  * **Styling:** `client/src/App.css` (Glassmorphic design system)

---

## 8. Current Organization & Role Architecture

### Structure
* **Organization:** Top-level entity.
* **Team:** Belongs to an Organization.
* **User:** Assigned a Role, optionally belongs to an Organization and Team.
* **CandidateProfile:** Belongs to an Organization (optional), tracked by `createdById` (Uploader) and `assignedManagerId` (Manager).

### Roles

#### 1. `ADMIN`
* Platform administrator with full access to the system.
* Can manage organizations, teams, and all users.
* Has access to all candidates regardless of team or uploader.

#### 2. `TEAM_MANAGER`
* Manages their own teams and candidates.
* Can view/manage users within their scope.
* Can upload, search, and manage candidates assigned to them or created by them (or their team members).

#### 3. `TEAM_MEMBER`
* Team member working under a manager.
* Can upload, view, and search candidates.
* Role was recently granted access to the `/resume-pipeline` and `/candidates` endpoints to allow full participation in ingestion.
