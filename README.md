# ATS — AI-Powered Applicant Tracking System

An AI-powered Applicant Tracking System designed to ingest, structure, index, and retrieve candidate profiles for intelligent recruitment workflows.

The project is built as a modular system with separate API orchestration, AI processing, object storage, relational data storage, and vector search layers.

## Current Status

The core candidate ingestion and semantic retrieval pipeline is implemented.

```text
Resume Upload
      ↓
BFF API
      ↓
MinIO Object Storage
      ↓
PostgreSQL Document Metadata
      ↓
AI Service
      ↓
PDF Text Extraction
      ↓
LLM-Assisted Candidate Profiling
      ↓
PostgreSQL Candidate Profile
      ↓
Candidate Index Builder
      ↓
BGE Embedding Generation
      ↓
Qdrant Vector Database
```

Candidate profiles can now be semantically retrieved and ranked against a job description.

```text
Job Description
      ↓
Embedding Generation
      ↓
Qdrant Vector Search
      ↓
Similarity Threshold
      ↓
Ranked Relevant Candidates
```

The current implementation establishes the core retrieval infrastructure required for future candidate-job matching and ranking features.

## Implemented Core Features

### Resume Ingestion

The BFF accepts candidate resumes using multipart form data.

Uploaded resume documents are stored in MinIO using generated object keys while preserving the original file extension.

Document metadata is stored in PostgreSQL.

### Resume Text Extraction

The AI service retrieves resume documents directly from MinIO and extracts raw text from PDF files.

### Generalized Candidate Profiling

Extracted resume text is processed into a generalized structured candidate profile.

The extraction system is designed for resumes across different industries and is not limited to software developers.

The current candidate profile structure supports:

* Candidate basic information
* Summary
* Work experience
* Education
* Skills
* Certifications
* Licenses
* Languages
* Achievements
* Projects
* Publications
* Awards
* Volunteer experience
* Other resume sections

The extraction layer follows strict data extraction rules and is designed to avoid resume rewriting, skill inference, title normalization, and factual invention.

### Candidate Profile Storage

Structured candidate profiles are stored in PostgreSQL using JSON data.

PostgreSQL acts as the source of truth for candidate information.

The original extracted resume text is also preserved.

### Candidate Semantic Indexing

Candidate profiles are transformed into semantic indexing text using relevant resume information such as:

* Work roles
* Organizations
* Experience descriptions
* Skills
* Projects
* Project descriptions
* Project skills

The generated candidate representation is converted into a vector embedding.

The current embedding model produces a 384-dimensional normalized vector.

### Vector Storage

Candidate embeddings are stored in Qdrant.

Each vector is associated with the candidate profile ID and searchable metadata.

Current vector metadata includes:

* Candidate location
* Candidate skills

Qdrant is used as the semantic retrieval layer and is not the primary candidate data store.

### Candidate Search

Job descriptions are converted into embeddings using the same embedding model used for candidate indexing.

Qdrant performs semantic similarity search against indexed candidate profiles.

Search results contain:

* Candidate ID
* Semantic similarity score
* Candidate metadata

A similarity threshold is used during retrieval to remove weak semantic matches.

The search engine currently acts as a candidate retrieval system.

Semantic similarity is not treated as the final candidate qualification score.

## Current Architecture

```text
                         Client
                            │
                            ▼
                     BFF API Service
                       Node.js
                       TypeScript
                       Express.js
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
         PostgreSQL       MinIO       AI Service
       Source of Truth   Documents       Python
                                           │
                           ┌───────────────┼───────────────┐
                           │               │               │
                           ▼               ▼               ▼
                    PDF Extraction   LLM Profiling    BGE Embedding
                                                           │
                                                           ▼
                                                        Qdrant
                                                   Semantic Vector Index
```

## Core Resume Pipeline

The complete resume processing flow is exposed through the BFF.

```text
POST /api/v1/resume-pipeline
```

The request accepts a resume file using multipart form data.

```text
file → PDF Resume
```

Processing flow:

1. The BFF receives the resume.
2. A unique object key is generated.
3. The original resume is uploaded to MinIO.
4. A `ResumeDocument` record is created in PostgreSQL.
5. The document status is changed to `PROCESSING`.
6. The AI service downloads the resume from MinIO.
7. Raw PDF text is extracted.
8. The resume is converted into a structured candidate profile.
9. The candidate profile and raw resume text are stored in PostgreSQL.
10. Candidate semantic indexing text is generated.
11. A 384-dimensional embedding is generated.
12. The candidate vector is stored in Qdrant.
13. The document status is changed to `PARSED`.

Successful response:

```json
{
  "success": true,
  "documentId": "document-uuid",
  "candidateId": "candidate-uuid",
  "status": "PARSED",
  "indexed": true
}
```

If the processing pipeline fails after document creation, the document status is changed to `FAILED`.

## Candidate Search Flow

Candidate semantic search is exposed through the BFF.

```text
POST /api/v1/search-candidates
```

Example request:

```json
{
  "jobDescription": "We are hiring a Flutter Developer to build and maintain cross-platform mobile applications using Flutter and Dart. The candidate should have experience with REST APIs, Firebase, state management, and Android application development.",
  "limit": 10
}
```

Search flow:

```text
Job Description
      ↓
BGE Embedding
      ↓
384-Dimensional Vector
      ↓
Qdrant Candidate Collection
      ↓
Cosine Similarity Search
      ↓
Similarity Threshold
      ↓
Ranked Candidates
```

Example response:

```json
{
  "success": true,
  "count": 1,
  "candidates": [
    {
      "candidateId": "candidate-uuid",
      "score": 0.79685944,
      "metadata": {
        "location": "Chennai, India",
        "skills": [
          "Flutter (Dart)",
          "Dart",
          "Android",
          "iOS",
          "Firebase"
        ]
      }
    }
  ]
}
```

## Data Storage Strategy

The ATS intentionally uses different storage systems for different responsibilities.

### PostgreSQL

PostgreSQL is the source of truth.

It stores:

* Resume document metadata
* Candidate structured profiles
* Original extracted resume text
* Processing status
* Profile version information

### MinIO

MinIO stores original candidate documents.

It is responsible for:

* Resume PDF storage
* Object key management
* Document retrieval by the AI service

### Qdrant

Qdrant stores semantic candidate indexes.

It is responsible for:

* Candidate embeddings
* Semantic similarity search
* Candidate retrieval
* Search metadata

Qdrant does not replace PostgreSQL.

```text
PostgreSQL = Candidate Truth
Qdrant     = Candidate Retrieval Index
MinIO      = Original Documents
```

## Database Models

### ResumeDocument

Stores document metadata and processing state.

```text
id
bucket
objectKey
originalName
mimeType
fileSize
status
createdAt
updatedAt
```

Supported document states:

```text
UPLOADED
PROCESSING
PARSED
FAILED
```

### CandidateProfile

Stores the structured candidate representation.

```text
id
documentId
profile
rawText
version
createdAt
updatedAt
```

The `profile` field uses PostgreSQL JSON storage to support generalized candidate profiles without forcing industry-specific relational schemas.

## Tech Stack

### BFF / API Service

* Node.js
* TypeScript
* Express.js
* Prisma ORM
* Axios
* Multer

### AI Service

* Python
* FastAPI
* PDF text extraction
* LLM-assisted structured extraction
* Sentence Transformers
* BGE embedding model

### Relational Database

* PostgreSQL

### Object Storage

* MinIO

### Vector Database

* Qdrant

### Infrastructure

* Docker
* Docker Compose

## Project Directory Structure

```text
ATS/
│
├── ai-service/
│   ├── api/
│   │   └── routes.py
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   ├── services/
│   │   ├── candidate/
│   │   │   ├── index_builder.py
│   │   │   └── search.py
│   │   │
│   │   ├── llm/
│   │   │   └── gemini.py
│   │   │
│   │   ├── resume/
│   │   │   ├── extractor.py
│   │   │   ├── pipeline.py
│   │   │   ├── profiler.py
│   │   │   └── regex_utils.py
│   │   │
│   │   ├── embedding.py
│   │   └── vector_store.py
│   │
│   ├── storage/
│   │   └── minio_client.py
│   │
│   ├── utils/
│   │   └── config.py
│   │
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── BFF/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── minio.ts
│   │   │   └── prisma.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── uploadedDoc.ts
│   │   │   └── searchCandidate.ts
│   │   │
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts
│   │   │   └── upload.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── prisma.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│
├── doc/
│
├── docker/
│   └── docker-compose.yml
│
└── README.md
```

## Service Responsibilities

### BFF

The BFF is the public API entry point for the ATS.

Responsibilities include:

* HTTP request handling
* Resume upload handling
* Pipeline orchestration
* PostgreSQL communication
* MinIO communication
* AI service communication
* API response handling

Clients communicate with the BFF rather than directly accessing the internal AI service.

### AI Service

The AI service contains resume intelligence and semantic retrieval functionality.

Responsibilities include:

* Resume document retrieval
* PDF text extraction
* Candidate profile extraction
* Candidate index text generation
* Embedding generation
* Qdrant vector indexing
* Semantic candidate search

The AI service is treated as an internal service.

### PostgreSQL

PostgreSQL stores authoritative ATS data.

Candidate profile information in PostgreSQL can be used to rebuild semantic indexes if the Qdrant collection is removed or recreated.

### Qdrant

Qdrant acts as the high-speed semantic candidate retrieval index.

The current `candidates` collection stores 384-dimensional normalized candidate embeddings.

## Current Core Feature

The current implemented core feature is:

```text
Resume → Candidate Profile → Semantic Candidate Index → JD Search
```

The system can now:

1. Accept a candidate resume.
2. Store the original document.
3. Extract resume text.
4. Build a generalized structured candidate profile.
5. Preserve candidate truth in PostgreSQL.
6. Generate a semantic candidate representation.
7. Generate a candidate embedding.
8. Store the vector in Qdrant.
9. Convert a job description into an embedding.
10. Retrieve and rank semantically relevant candidates.

## Current Limitation

The current candidate search score represents semantic similarity.

```text
Semantic Similarity ≠ Candidate Qualification
```

For example, candidates with general software engineering experience may receive moderate similarity scores for specialized technical roles because of overlapping concepts such as APIs, architecture, databases, deployment, and version control.

Qdrant is therefore used as a candidate retrieval engine rather than the final matching judge.

## Next Core Feature

The next major module is the Job Description Matching Engine.

Planned flow:

```text
Job Description
      ↓
JD Requirement Extraction
      ↓
Semantic Candidate Retrieval
      ↓
Top Candidate Pool
      ↓
Hard Requirement Matching
      ↓
Skill Matching
      ↓
Experience Matching
      ↓
Weighted Scoring
      ↓
Final Candidate Ranking
```

The matching engine will evaluate candidate qualification separately from semantic similarity.

## Planned MVP Modules

The ATS architecture is designed around the following domains:

* Identity & Access
* Organization
* Candidate Management
* Job Management
* Application Management
* Interview Management
* Document Management
* AI Services
* Candidate Retrieval
* Job Matching
* Candidate Ranking

Future capabilities may include:

* JD requirement extraction
* Deterministic candidate scoring
* Candidate ranking
* Skill gap analysis
* Intelligent recruiter search
* Interview automation
* Recruitment workflow automation

## Project Goal

The goal of this project is to build a scalable AI-powered ATS foundation where traditional recruitment data, document storage, AI processing, and semantic retrieval are separated into clear architectural boundaries.

The project currently focuses on building and validating the core candidate intelligence infrastructure before introducing broader recruitment workflow features.

## Development Status

🚧 Active Development

### Current Milestone

✅ Resume document storage  
✅ Resume text extraction  
✅ Generalized candidate profiling  
✅ Candidate profile persistence  
✅ Candidate embedding generation  
✅ Qdrant vector indexing  
✅ Semantic JD candidate retrieval  
✅ Similarity-based candidate ranking  

### Next Milestone

🚧 JD Requirement Extraction and Candidate Matching Engine

The architecture and implementation may continue to evolve as additional ATS modules are introduced.