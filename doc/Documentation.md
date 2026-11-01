# ATS (Applicant Tracking System) — Comprehensive Technical & Feature Documentation

> **Version:** 1.0.0  
> **Target Environment:** Dockerized Microservices (Client, BFF, AI-Service, PostgreSQL, MinIO, Qdrant)  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Executive Summary & Architecture Overview](#1-executive-summary--architecture-overview)
2. [Technology Stack & System Components](#2-technology-stack--system-components)
3. [Infrastructure & Deployment (Docker Compose)](#3-infrastructure--deployment-docker-compose)
4. [Domain Model & Database Schema (PostgreSQL & Prisma)](#4-domain-model--database-schema-postgresql--prisma)
5. [Storage Architecture (MinIO & Qdrant)](#5-storage-architecture-minio--qdrant)
6. [Core Feature Specifications](#6-core-feature-specifications)
   - 6.1 [Authentication & Multi-Tenant Organization Isolation](#61-authentication--multi-tenant-organization-isolation)
   - 6.2 [Dynamic RBAC & Permission Matrix](#62-dynamic-rbac--permission-matrix)
   - 6.3 [User & Reporting Hierarchy Management](#63-user--reporting-hierarchy-management)
   - 6.4 [Client Accounts (CRM)](#64-client-accounts-crm)
   - 6.5 [Hiring Requirements & Requisitions (JD Lifecycle)](#65-hiring-requirements--requisitions-jd-lifecycle)
   - 6.6 [Resume Processing & Intelligent Profiling Pipeline](#66-resume-processing--intelligent-profiling-pipeline)
   - 6.7 [Deterministic Experience Calculation Engine](#67-deterministic-experience-calculation-engine)
   - 6.8 [Dual-Mode AI Search & Matching Engine](#68-dual-mode-ai-search--matching-engine)
   - 6.9 [Multi-Factor Scoring & Ranking Algorithm](#69-multi-factor-scoring--ranking-algorithm)
   - 6.10 [Recruitment Pipeline & Application Tracking](#610-recruitment-pipeline--application-tracking)
   - 6.11 [Executive Dashboard, Analytics & Reporting](#611-executive-dashboard-analytics--reporting)
   - 6.12 [Printable Candidate Match Report Generator](#612-printable-candidate-match-report-generator)
7. [API Specification & Endpoint Reference](#7-api-specification--endpoint-reference)
   - 7.1 [BFF (Backend-For-Frontend) REST API](#71-bff-backend-for-frontend-rest-api)
   - 7.2 [AI Microservice Internal REST API](#72-ai-microservice-internal-rest-api)
8. [Configuration & Environment Variables](#8-configuration--environment-variables)
9. [Operational Runbook & Troubleshooting](#9-operational-runbook--troubleshooting)

---

## 1. Executive Summary & Architecture Overview

The **Applicant Tracking System (ATS)** is an enterprise-grade, AI-driven recruitment and candidate pipeline platform. It transforms unstructured resumes into structured, searchable talent graphs, matches candidate profiles against Job Descriptions (JDs) using hybrid vector-semantic and heuristic scoring algorithms, and manages the entire hiring lifecycle from requirement creation through application stages to final offer.

### System Architecture Flow

```
                                  ┌───────────────────────────┐
                                  │   React 19 Frontend SPA   │
                                  │   (Vite + TS + Aurora UI) │
                                  └─────────────┬─────────────┘
                                                │ HTTP / REST
                                                ▼
                                  ┌───────────────────────────┐
                                  │  BFF (Backend for Front)  │
                                  │  Express 5 + Prisma ORM   │
                                  └──────┬──────────────┬─────┘
                                         │              │
                       ┌─────────────────┘              └────────────────┐
                       ▼                                                 ▼
        ┌─────────────────────────────┐                   ┌─────────────────────────────┐
        │    PostgreSQL 17 Database   │                   │    MinIO Object Storage     │
        │ - Relational Data (Auth)    │                   │ - Raw PDF Resumes           │
        │ - Candidate Profiles        │                   │ - Bucket: ats-resumes       │
        │ - Requirements & Pipeline   │                   └──────────────┬──────────────┘
        │ - Multi-Tenant Isolation    │                                  │
        └─────────────────────────────┘                                  │ Download PDF
                                                                         ▼
                                                          ┌─────────────────────────────┐
                                                          │   FastAPI AI Microservice   │
                                                          │ - PyMuPDF (Text Extraction) │
                                                          │ - Gemini 2.5 Flash (Parsing)│
                                                          │ - SentenceTransformers BGE  │
                                                          │ - Deterministic Experience  │
                                                          └──────────────┬──────────────┘
                                                                         │
                                                                         ▼ Vector Upsert / Search
                                                          ┌─────────────────────────────┐
                                                          │   Qdrant Vector Database    │
                                                          │ - 384-dim Dense Embeddings  │
                                                          │ - Cosine Distance Collection│
                                                          └─────────────────────────────┘
```

---

## 2. Technology Stack & System Components

### 2.1 Frontend Client (`/client`)
- **Framework:** React 19 (SPA) with TypeScript
- **Bundler & Tooling:** Vite 8, React Router v6
- **UI Architecture:** Aurora Glassmorphic Design System, Custom SVG gauge charts, Lucide-style iconography, Responsive Grid layouts
- **State & Context:** React Context API (`AuthContext`), optimistic UI updates, native Drag-and-Drop file ingest
- **Reporting:** Client-side dynamic HTML report compiler with instant browser print / PDF export capability

### 2.2 Backend For Frontend (`/BFF`)
- **Runtime:** Node.js v22 (Alpine) with TypeScript (via `tsx`)
- **Framework:** Express 5.2
- **ORM & Database Client:** Prisma ORM 6.19
- **Authentication:** Stateless JSON Web Token (`jsonwebtoken`), `bcryptjs` password hashing
- **Object Storage Client:** MinIO JavaScript SDK 8.0
- **HTTP Client:** Axios 1.18 with timeout policies and in-memory TTL caching
- **Ranking Engine:** TypeScript Multi-Factor Score Calculator with synonym resolution dictionaries

### 2.3 AI Microservice (`/ai-service`)
- **Runtime:** Python 3.13 (Slim)
- **Framework:** FastAPI with Uvicorn (ASGI)
- **Document Processing:** PyMuPDF (`fitz`) for PDF text layer extraction
- **LLM Engine:** Google GenAI SDK with `gemini-2.5-flash` utilizing Structured Outputs (`response_schema=PydanticModel`)
- **Vector Embeddings:** `sentence-transformers` (`BAAI/bge-small-en-v1.5`, 384-dimensional dense vectors) with `@lru_cache`
- **Vector DB Client:** `qdrant-client` HTTP/gRPC

### 2.4 Data & Storage Engines
- **PostgreSQL 17:** Primary transactional datastore for relational entities, audit logs, and JSON profile payloads
- **Qdrant Vector Engine:** Specialized high-performance vector database for cosine similarity search
- **MinIO:** High-performance, S3-compatible blob storage for raw resume documents

---

## 3. Infrastructure & Deployment (Docker Compose)

All services are orchestrated via Docker Compose (`docker/docker-compose.yml`):

| Service Name | Container Name | Base Image / Context | Ports | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` | `ats-postgres` | `postgres:17` | `5433:5432` | Relational database storage |
| `minio` | `ats-minio` | `chainguard/minio:latest` | `9000:9000`, `9001:9001` | S3 API & Web Console |
| `qdrant` | `ats-qdrant` | `qdrant/qdrant:latest` | `6333:6333`, `6334:6334` | Vector storage & nearest-neighbor search |
| `ai-service` | `ats-ai-service` | `../ai-service` (Python 3.13) | `8000:8000` | PDF parsing, embedding, & LLM extraction |
| `bff` | `ats-bff` | `../BFF` (Node 22) | `3000:3000` | Application API, Auth, Ranking Engine |
| `client` | `ats-client` | `../client` (Node 22) | `5173:5173` | React web application |

### Persistent Docker Volumes
- `postgres_data`: Persists PostgreSQL data files at `/var/lib/postgresql/data`
- `minio_data`: Persists S3 objects at `/data`
- `qdrant_data`: Persists vector points and HNSW indices at `/qdrant/storage`

---

## 4. Domain Model & Database Schema (PostgreSQL & Prisma)

The relational schema is defined in `BFF/prisma/schema.prisma` and managed through Prisma migrations.

### Core Entities & Relationships

```mermaid
erDiagram
    Organization ||--o{ User : "members"
    Organization ||--o{ Team : "teams"
    Organization ||--o{ Role : "roles"
    Organization ||--o{ Account : "client accounts"
    Organization ||--o{ Requirement : "requisitions"
    Organization ||--o{ CandidateProfile : "candidates"
    Organization ||--o{ Application : "applications"

    Role ||--o{ RolePermission : "has"
    Permission ||--o{ RolePermission : "granted to"
    Role ||--o{ User : "assigned to"

    Team ||--o{ User : "contains"
    User ||--o{ User : "reports to"

    Account ||--o{ Requirement : "requests"
    Requirement ||--o{ Application : "receives"
    Requirement ||--o{ RequirementHistory : "audited by"

    ResumeDocument ||--|| CandidateProfile : "parsed into"
    CandidateProfile ||--o{ Application : "applies via"

    Application ||--o{ PipelineHistory : "tracks stages"
```

### Key Models

1. **`Organization`**: Multi-tenant boundary. All operational resources (teams, accounts, requirements, candidates, applications) belong to an organization.
2. **`User`**: System user with email, hashed password, role assignment, optional team, and self-referential `reportingPersonId` for organogram hierarchies. The `exception` boolean marks executives (e.g. MD/CEO) exempted from reporting requirements.
3. **`Role` & `Permission`**: Dynamic RBAC structure. Permissions are granular string keys (`candidate:create`, `requirement:view`, etc.), bound to roles through `RolePermission`.
4. **`Team`**: Functional unit within an organization (e.g., "Engineering Recruitment", "Executive Search").
5. **`ResumeDocument`**: Tracks uploaded raw files in MinIO with object keys, MIME types, file sizes, and processing statuses (`UPLOADED`, `PROCESSING`, `PARSED`, `FAILED`).
6. **`CandidateProfile`**: Stores the structured JSON profile extracted by AI, raw plain text, deterministic `totalExperienceYears`, workflow status, assigned manager, and creator reference.
7. **`Account`**: Represents client companies. Stores company name, business source, client contact information, and internal Key Account Person (KAP).
8. **`Requirement`**: Hiring requisition. Auto-generates unique `requirementCode` (e.g., `REQ-001`), stores target skills, experience limits, assigned manager, assigned recruiter, status, and target dates.
9. **`RequirementHistory`**: Immutable audit trail for requirements capturing change type, affected fields, previous/new values, remarks, and user attribution.
10. **`Application`**: Junction between `CandidateProfile` and `Requirement`. Auto-generates `applicationCode` (e.g., `APP-001`), captures the AI match score snapshot at time of application, and tracks candidate progression.
11. **`PipelineHistory`**: Stage transition history for an application (`fromStatus` -> `toStatus`), timestamped and linked to the modifying recruiter.
12. **`ActivityLog`**: Global platform audit trail capturing entity actions (`CANDIDATE_UPLOADED`, `STATUS_CHANGED`, etc.) with JSON payload context.

---

## 5. Storage Architecture (MinIO & Qdrant)

### 5.1 Object Storage (MinIO)
- **Bucket:** `ats-resumes` (automatically initialized upon BFF startup).
- **Object Key Strategy:** UUID-based filenames (e.g., `9f4c3a1d-7b2e-4a6c-8e1f-0b3d5e7a9c1b.pdf`).
- **Access Flow:**
  1. Frontend sends PDF to `POST /api/v1/resume-pipeline`.
  2. BFF uploads binary stream to MinIO via `minio.putObject()`.
  3. BFF invokes AI-Service passing the `objectKey`.
  4. AI-Service streams bytes from MinIO, parses them in memory, and persists structured representations.

### 5.2 Vector Database (Qdrant)
- **Collection Name:** `candidates`
- **Vector Dimension:** 384 dimensions (`BAAI/bge-small-en-v1.5`)
- **Distance Metric:** Cosine Similarity (`Distance.COSINE`)
- **Payload Schema:**
  ```json
  {
    "name": "Arun Kumar",
    "role": "Sr. Engineer - Process Engineering",
    "location": "Mumbai, Maharashtra, India",
    "skills": ["APQP", "PPAP", "SPC", "PFMEA", "Lean Six Sigma"],
    "totalExperienceYears": 10.5,
    "organizationId": "f7a4436d-ded6-40d7-b20e-999d5191b196"
  }
  ```
- **Filter Capabilities:** Payload indices support filtered vector search by `organizationId` and numeric range filtering on `totalExperienceYears` (`gte` / `lte`).

---

## 6. Core Feature Specifications

### 6.1 Authentication & Multi-Tenant Organization Isolation
- **Stateless JWT:** Authenticated requests carry `Bearer <token>` signed with `JWT_SECRET`.
- **Tenant Context:** Requests are automatically scoped to `user.organizationId`. Platform administrators have global scope (`organizationId: null`).
- **Security Interceptors:** All data access queries enforce organization filtering:
  ```ts
  if (user.organizationId) {
    whereClause.organizationId = user.organizationId;
  }
  ```

### 6.2 Dynamic RBAC & Permission Matrix
Permissions are decoupled from code logic through dynamic database permissions:

| Permission Key | Description |
| :--- | :--- |
| `organization:view`, `create`, `update`, `delete` | Organization administration |
| `team:view`, `create`, `update`, `delete` | Team management |
| `user:view`, `create`, `update`, `delete` | User provisioning & management |
| `candidate:view`, `create`, `update`, `delete` | Candidate searching, viewing, & profile management |
| `resume:view`, `upload`, `download`, `delete` | Direct resume file management |
| `requirement:view`, `create`, `update`, `delete` | Job requisition management |
| `application:view`, `create`, `update`, `delete` | Application tracking & pipeline transitions |
| `account:view`, `create`, `update`, `delete` | Client account management |
| `report:view`, `report:export` | Analytics & reporting access |
| `dashboard:view` | Dashboard access |
| `role:manage` | Custom role & permission configuration |

#### Default Seeded Roles:
- **`ADMIN`**: Platform administrator with all 36 permissions.
- **`RECRUITMENT_MANAGER`**: Oversees recruiters, requisitions, accounts, and reports (22 permissions).
- **`RECRUITER`**: Handles sourcing, screening, candidate creation, and application pipelines (15 permissions).
- **`TEAM_MANAGER`**: Candidate and team management (14 permissions).
- **`ACCOUNT_MANAGER`**: Manages client companies and job requirements (10 permissions).
- **`HR`**: Manages post-selection onboarding and status updates (6 permissions).
- **`REPORT_VIEWER`**: Read-only access to dashboards and metrics (7 permissions).

---

### 6.3 User & Reporting Hierarchy Management
- **Organogram Structure:** Every user can report to another user via the self-referential `reportingPersonId`.
- **Exception Flag:** The `exception` boolean permits top-level management (CEOs, Managing Directors) to exist without a mandatory manager without breaking validation rules.
- **Hierarchy Traversal:** Endpoints `/api/v1/users/:id/hierarchy` and `/api/v1/users/:id/subordinates` traverse the organogram tree recursively.

---

### 6.4 Client Accounts (CRM)
- Manages business client entities including company name, business source (e.g., Inbound, Referral), client-side contact details, and assigned internal **Key Account Person (KAP)**.
- Accounts aggregate all associated hiring requirements and job requisitions.

---

### 6.5 Hiring Requirements & Requisitions (JD Lifecycle)
- **Auto Requisition Code:** Automatic generation of sequence codes (`REQ-001`, `REQ-002`).
- **AI Candidate Matching:** Directly from any requirement detail page, recruiters can click "Match Candidates" to run the candidate matching algorithm against the requisition's JD text.
- **Lifecycle Statuses:** `OPEN`, `ON_HOLD`, `CLOSED`, `CANCELLED`.
- **Audit History:** Every edit or status change records a `RequirementHistory` row with user attribution and previous/new values.

---

### 6.6 Resume Processing & Intelligent Profiling Pipeline

```
Raw PDF Ingest
     │
     ▼
[PyMuPDF / fitz] ──► Extracted Plain Text
     │
     ▼
[Gemini 2.5 Flash] ──► Strict Structured JSON Profile
  (response_schema)     (Personal info, Experience array, Education, Skills, Projects)
     │
     ▼
[Deterministic Enricher] ──► Calculates Overlap-Free Total Experience Years
     │
     ├─────────────────────────────────┬─────────────────────────────────┐
     ▼                                 ▼                                 ▼
PostgreSQL Persistence          SentenceTransformers             MinIO S3 Archive
(CandidateProfile + JSON)       (bge-small-en-v1.5 Embedding)    (Raw PDF stored)
                                       │
                                       ▼
                               Qdrant Vector DB
                               (Upsert 384-dim vector + metadata)
```

1. **Extraction:** PDF is read from MinIO; PyMuPDF extracts clean text without external OCR dependencies.
2. **LLM Profiling:** Gemini 2.5 Flash extracts a validated Pydantic model (`CandidateProfileSchema`):
   - Candidate personal info (Name, Email, Phone, Location, Portfolio links).
   - Experience list (Organization, Title, Dates, Bullet points).
   - Education list (Institution, Degree, Field of study, Year).
   - Skills array (preserving specific qualifiers).
   - Projects, Certifications, and Custom sections.

---

### 6.7 Deterministic Experience Calculation Engine

Located in `ai-service/services/experience.py`, this engine computes verified career experience **deterministically** rather than trusting LLM estimates:
- **Date Parsing:** Handles formats including `Month YYYY`, `YYYY-MM`, `MM/YYYY`, `Present`, `Current`, `Till Date`.
- **Interval Merging:** Merges overlapping employment intervals using an interval scheduling algorithm, preventing inflated totals when a candidate holds concurrent roles or freelances.
- **Output:** Writes `totalExperienceYears` to the profile, which is stored in a dedicated indexed column in PostgreSQL and as payload in Qdrant for millisecond range queries.

---

### 6.8 Dual-Mode AI Search & Matching Engine

The search interface provides two distinct matching modalities:

1. **Job Description Search (`POST /api/v1/search-candidates`):**
   - User inputs freeform JD text.
   - AI service parses the JD using Gemini 2.5 Flash with structured outputs (`SearchQuery` model) into target title, domain, required skills, preferred skills, and experience range.
   - Vector search performs semantic retrieval in Qdrant.
   - Scoring engine ranks returned candidates.
2. **Resume-to-Resume Search (`POST /api/v1/search-by-resume`):**
   - User uploads a benchmark resume PDF.
   - PyMuPDF extracts text, and `bge-small-en-v1.5` embeds the document vector directly.
   - Qdrant finds the nearest candidate vectors in the talent pool.

---

### 6.9 Multi-Factor Scoring & Ranking Algorithm

Candidate matching calculates a composite match score across five weighted dimensions:

$$\text{FinalScore} = (0.35 \times S_{\text{semantic}}) + (0.35 \times S_{\text{skill}}) + (0.15 \times S_{\text{title}}) + (0.10 \times S_{\text{experience}}) + (0.05 \times S_{\text{education}})$$

#### Weight Distribution (`RankingConfig`)
- **Semantic Match (35%):** Cosine similarity between the JD query vector and the candidate's comprehensive profile embedding.
- **Skill Match (35%):**
  - Evaluated via `SkillMatcher` with `SynonymResolver` (e.g., mapping `k8s` -> `kubernetes`, `react.js` -> `react`, `postgres` -> `postgresql`).
  - Identifies **Matched Skills** and **Missing Skills**.
  - Formula: $\text{Matched Count} / \text{Total Required Skills}$.
- **Title Match (15%):** Word-boundary regex matching between the target job title and candidate's historical job titles.
- **Experience Score (10%):**
  - Candidate within required range $[min, max]$: **100% score (1.0)**.
  - Candidate over-experienced: Gentle penalty ($1.0 - (\text{overshoot} \times 0.05)$).
  - Candidate under-experienced: Strict penalty ($1.0 - (\text{gap} \times 0.15)$).
- **Education Score (5%):** Baseline alignment.

---

### 6.10 Recruitment Pipeline & Application Tracking
- **Application Junction:** Links candidates to requisitions (`candidateId` + `requirementId` unique constraint).
- **Kanban Stages:**
  1. `NEW` — Initial match or application.
  2. `SCREENING` — Recruiter phone or resume screening.
  3. `SHORTLISTED` — Passed to hiring manager.
  4. `INTERVIEW` — Scheduled for technical/behavioral interview.
  5. `SELECTED` — Candidate selected for offer.
  6. `REJECTED` — Disqualified or declined.
  7. `HIRED` — Offer accepted and onboarded.
- **Stage Audit Trail:** Every movement generates a `PipelineHistory` record with previous status, new status, timestamp, and recruiter remarks.

---

### 6.11 Executive Dashboard, Analytics & Reporting
- **Executive Summary (`/dashboard/summary`):**
  - Total candidates, total active requirements, open positions, total applications, and hiring conversion rate.
- **Manager Breakdown (`/dashboard/managers`):**
  - Performance and load per hiring manager.
- **Team Distribution (`/dashboard/teams`):**
  - Requisition and candidate distribution across organizational teams.
- **Activity Stream (`/dashboard/activity`):**
  - Live chronological activity feed of all platform events.
- **Domain Reports (`/reports/*`):**
  - Dedicated reports for Account health, Requirement turnaround, Recruiter productivity, and Manager pipelines.

---

### 6.12 Printable Candidate Match Report Generator
- Built-in report compiler (`generateReport.ts`) generates clean, self-contained, printable HTML documents.
- Includes match score radial gauges, score breakdowns, matched/missing skill badges, candidate career summaries, and AI recommendations.
- Triggers browser print preview for saving as a standardized PDF dossier.

---

## 7. API Specification & Endpoint Reference

### 7.1 BFF (Backend-For-Frontend) REST API

All API endpoints are prefixed with `/api/v1`.

#### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates user with email and password; returns JWT token. |
| `POST` | `/auth/register` | Dev Only | Creates a initial user (disabled in production). |
| `GET` | `/auth/me` | Authenticated | Retrieves current user session, permissions, and organization details. |

#### Candidate Management (`/candidates` & `/search-*`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/candidates` | `candidate:view` | Lists candidate profiles with pagination, search, and manager filter. |
| `GET` | `/candidates/:id` | `candidate:view` | Fetches a candidate's full profile, document metadata, and notes. |
| `GET` | `/candidates/:id/detail` | `candidate:view` | Fetches consolidated candidate detail with application history. |
| `POST` | `/candidates` | `candidate:create` | Ingests and processes a single resume file. |
| `PATCH` | `/candidates/:id` | `candidate:update` | Updates candidate profile fields or metadata. |
| `DELETE` | `/candidates/:id` | `candidate:delete` | Removes candidate record, MinIO PDF, and Qdrant vector point. |
| `PATCH` | `/candidates/:id/assign` | `candidate:update` | Reassigns candidate to a different team manager. |
| `PATCH` | `/candidates/:id/status` | `candidate:update` | Updates candidate workflow status (`NEW` through `HIRED`). |
| `GET` | `/candidates/:id/resume` | `resume:download` | Streams the original PDF resume from MinIO. |
| `POST` | `/search-candidates` | `candidate:view` | Semantic JD search with experience and limit filters. |
| `POST` | `/search-by-resume` | `candidate:view` | Multipart PDF resume-to-resume similarity search. |

#### Resume Batch Pipeline (`/resume-pipeline`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/resume-pipeline` | `resume:upload` | Multipart upload for up to 10 resume PDFs simultaneously. |

#### Requisitions & Requirements (`/requirements`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/requirements` | `requirement:view` | Lists job requirements with status, account, and manager filters. |
| `POST` | `/requirements` | `requirement:create` | Creates a new requirement (auto-generates `requirementCode`). |
| `GET` | `/requirements/:id` | `requirement:view` | Fetches requirement details, assigned staff, and applications. |
| `PATCH` | `/requirements/:id` | `requirement:update` | Updates requirement fields; logs to `RequirementHistory`. |
| `DELETE` | `/requirements/:id` | `requirement:delete` | Soft/hard deletes a requirement. |
| `GET` | `/requirements/:id/history` | `requirement:view` | Retrieves full audit log for a requirement. |
| `POST` | `/requirements/:id/match` | `candidate:view` | Runs AI matching algorithm against candidate database for this JD. |

#### Client Accounts (`/accounts`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/accounts` | `account:view` | Lists client accounts with status and contact details. |
| `POST` | `/accounts` | `account:create` | Creates a new client company record. |
| `GET` | `/accounts/:id` | `account:view` | Fetches account details and associated requirements. |
| `PATCH` | `/accounts/:id` | `account:update` | Modifies account metadata and Key Account Person assignment. |
| `DELETE` | `/accounts/:id` | `account:delete` | Deletes an account. |

#### Applications & Hiring Pipeline (`/applications`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/applications` | `application:view` | Lists all applications across the organization. |
| `POST` | `/applications` | `application:create` | Creates candidate-requirement application with initial match score. |
| `PATCH` | `/applications/:id/status`| `application:update` | Transitions application stage and logs to `PipelineHistory`. |
| `GET` | `/applications/:id/history`| `application:view` | Returns stage transition history for an application. |
| `GET` | `/applications/requirement/:reqId` | `application:view` | Fetches all candidate applications for a specific requirement. |

#### User Management & Hierarchy (`/users`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | `user:view` | Lists users within the organization. |
| `POST` | `/users/invite` | `user:create` | Invites/provisions a new user with role and manager assignment. |
| `PATCH` | `/users/:id` | `user:update` | Updates user profile, department, employee code, or manager. |
| `PATCH` | `/users/:id/role` | `role:manage` | Changes a user's assigned role. |
| `PATCH` | `/users/:id/team` | `user:update` | Assigns or transfers a user to a team. |
| `DELETE` | `/users/:id` | `user:delete` | Removes or deactivates a user. |
| `GET` | `/users/:id/hierarchy` | `user:view` | Retrieves upstream reporting chain to executive level. |
| `GET` | `/users/:id/subordinates` | `user:view` | Retrieves direct and indirect downstream reportees. |

#### Roles & Permissions (`/roles`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/roles` | `role:manage` | Lists all standard and custom organization roles. |
| `POST` | `/roles` | `role:manage` | Creates a custom role with a specific permission array. |
| `GET` | `/roles/permissions` | `role:manage` | Returns the master dictionary of all valid system permissions. |
| `GET` | `/roles/:id` | `role:manage` | Fetches a single role with attached permissions. |
| `PATCH` | `/roles/:id` | `role:manage` | Updates role name, description, or assigned permission keys. |
| `DELETE` | `/roles/:id` | `role:manage` | Deletes a custom role. |

#### Dashboard & Analytics (`/dashboard` & `/reports`)
| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/summary` | `dashboard:view` | High-level KPI counts (candidates, requirements, applications). |
| `GET` | `/dashboard/managers` | `user:view` | Aggregated candidate counts per manager. |
| `GET` | `/dashboard/teams` | `team:view` | Team requisition distribution. |
| `GET` | `/dashboard/activity` | `dashboard:view` | Recent audit events from `ActivityLog`. |
| `GET` | `/reports/account` | `report:view` | Aggregated client account performance report. |
| `GET` | `/reports/requirement` | `report:view` | Time-to-fill and stage breakdown per requirement. |
| `GET` | `/reports/recruiter` | `report:view` | Candidate sourcing and placement volume by recruiter. |
| `GET` | `/reports/manager` | `report:view` | Team manager requisition conversion metrics. |

---

### 7.2 AI Microservice Internal REST API

Host: `http://ai-service:8000`

| Endpoint | Method | Input Model | Output Model | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | None | `{"status": "ok"}` | Service health probe. |
| `/parse-resume` | `POST` | `ParseResumeRequest` (`objectKey`) | `ParseResumeResponse` | Streams PDF from MinIO, extracts text, profiles via Gemini, enriches experience. |
| `/build-candidate-index` | `POST` | `CandidateIndexRequest` | `CandidateIndexResponse` | Generates 384-dim vector and upserts point into Qdrant. |
| `/parse-job-description` | `POST` | `ParseJDRequest` (`jobDescription`) | `SearchQuery` | Extracts structured skills, title, and experience from JD text via Gemini. |
| `/search-candidates` | `POST` | `CandidateSearchRequest` | `CandidateSearchResponse` | Embeds JD and queries Qdrant with optional experience/tenant filters. |
| `/search-by-resume` | `POST` | `multipart/form-data` (`file`) | `CandidateSearchResponse` | Extracts uploaded PDF text, embeds vector, and queries Qdrant directly. |
| `/delete-candidate-index/:id` | `DELETE`| Path parameter (`candidateId`) | `{"success": true}` | Deletes point from Qdrant collection. |

---

## 8. Configuration & Environment Variables

### 8.1 BFF Service (`/BFF/.env`)
```bash
# PostgreSQL Connection String
DATABASE_URL="postgresql://ats:ats123@postgres:5432/ats"

# MinIO S3 Credentials
MINIO_ENDPOINT="minio"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="admin12345"
MINIO_BUCKET="ats-resumes"

# AI Microservice URL
AI_SERVICE_URL="http://ai-service:8000"

# JWT Authentication Configuration
JWT_SECRET="ats-dev-secret-key-998877"
JWT_EXPIRES_IN="7d"

# Server Port
PORT=3000
NODE_ENV="development"
```

### 8.2 AI Service (`/ai-service/.env`)
```bash
# MinIO Connection
MINIO_ENDPOINT="minio:9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="admin12345"
MINIO_BUCKET="ats-resumes"

# Google Gemini API Keys (supports comma-separated list for automatic key rotation)
GEMINI_API_KEYS="your-google-gemini-api-key-here"

# Model Selection (defaults to gemini-2.5-flash)
GEMINI_MODEL="gemini-2.5-flash"
```

### 8.3 Frontend Client (`/client/.env`)
```bash
VITE_API_URL="http://localhost:3000/api/v1"
```

---

## 9. Operational Runbook & Troubleshooting

### 9.1 Starting the System
To launch all services from a cold start:
```powershell
# From the project root:
.\up.bat

# Or using Docker Compose directly:
cd docker
docker compose up -d
```

### 9.2 Running Database Migrations & Seeds
Database migrations apply automatically on BFF container launch. To manually redeploy schema migrations or re-seed:
```powershell
cd docker
docker compose exec bff npx prisma migrate deploy
docker compose exec bff npm run seed
```

### 9.3 Default Login Accounts
After running the database seed, the following accounts are initialized with password `password`:

| Email | Role | Description |
| :--- | :--- | :--- |
| `admin@ats.dev` | `ADMIN` | Global platform administrator (full permissions) |
| `rm@ats.dev` | `RECRUITMENT_MANAGER` | Recruitment Manager oversight |
| `recruiter@ats.dev` | `RECRUITER` | Operational Recruiter |
| `manager@ats.dev` | `TEAM_MANAGER` | Team Manager |
| `member@ats.dev` | `TEAM_MEMBER` | Team Member |

### 9.4 Common Troubleshooting Scenarios

#### 1. MinIO Pull Denied / 401 Unauthorized
- **Cause:** MinIO removed public community images from Docker Hub and Quay.io.
- **Fix:** Ensure `docker-compose.yml` uses the official public Chainguard build: `image: chainguard/minio:latest`.

#### 2. PostgreSQL `relation "public.User" does not exist`
- **Cause:** PostgreSQL started with an empty volume and migrations were not executed.
- **Fix:** Execute `docker compose exec bff npx prisma migrate deploy` followed by `docker compose exec bff npm run seed`.

#### 3. String contains embedded null during Prisma Migration
- **Cause:** SQL migration file was saved with UTF-16LE / BOM encoding.
- **Fix:** Convert SQL files to clean UTF-8 without BOM. Run `npx prisma migrate resolve --rolled-back <migration_name>` and re-deploy.

#### 4. Candidate Search Latency / High Response Times
- **Cause:** Calling legacy Gemini models or uncached model inferences.
- **Fix:** Verify `GEMINI_MODEL=gemini-2.5-flash` in `ai-service/.env`. Embedding queries and parsed JDs are automatically cached in-memory with LRU and TTL policies.

---
*End of Documentation.*

