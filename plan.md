ATS — Next Phase Implementation Plan
1. Where We Are Now

Your current ATS already has the AI candidate intelligence foundation:

Resume
   ↓
Upload
   ↓
MinIO
   ↓
PDF Extraction
   ↓
Gemini Structured Profile
   ↓
Experience Calculation
   ↓
PostgreSQL Candidate
   ↓
BGE Embedding
   ↓
Qdrant
   ↓
Semantic Search
   ↓
Hybrid Ranking
   ↓
Ranked Candidates

And the current application has:

Authentication
RBAC
Organization
Teams
Users
Candidates
Resume Upload
Candidate Search
AI Matching
Dashboard

So these should be preserved.

2. What We Are Building Now

The new phase should transform the system from:

AI Resume Search System

into:

Full Recruitment Management + Tracking + Reporting + AI ATS

The new business flow becomes:

                    CORPORATE USERS
                         │
                         ▼
                ROLE & ACCESS MASTER
                         │
                         ▼
                  USER / EMPLOYEE
                         │
                  REPORTING HIERARCHY
                         │
                         ▼
                    ACCOUNT MASTER
                         │
                         ▼
                 REQUIREMENT MASTER
                         │
                         ▼
                  CANDIDATE SEARCH
                         │
                         ▼
                    APPLICATION
                         │
                         ▼
                RECRUITMENT PIPELINE
                         │
       ┌─────────┬─────────┬──────────┬──────────┐
       ▼         ▼         ▼          ▼          ▼
      NEW    SCREENING  SHORTLISTED INTERVIEW  SELECTED
                                                    │
                                                    ▼
                                                  HIRED

With reporting across every level.

3. Phase 1 — Role & Access Master

This should be the first thing we implement because almost every other module depends on users and permissions.

Goal

Replace the current simple:

ADMIN
TEAM_MANAGER
TEAM_MEMBER

business model with a proper corporate user/access structure.

Employee/User Master

We should support fields such as:

User
├── UID
├── Employee Code
├── Name
├── Email
├── Contact Number
├── Role
├── Reporting Person
├── Department
├── Status
├── Exception
├── Created At
└── Updated At
Reporting hierarchy

Example:

CEO
 │
 ├── Director
 │    ├── Recruitment Manager
 │    │    ├── Recruiter A
 │    │    ├── Recruiter B
 │    │    └── Recruiter C
 │    │
 │    └── Recruitment Manager 2
 │
 └── HR Head

For CEO/MD:

reportingPerson = NULL
exception = true

The system should not hard-code CEO/MD logic. The exception should be data-driven.

4. Dynamic Role & Permission System

Since you previously started moving toward table-based RBAC, this is the right time to finish that architecture.

Entities
User
  │
  ▼
Role
  │
  ▼
RolePermission
  │
  ▼
Permission

Example roles:

ADMIN
RECRUITMENT_MANAGER
RECRUITER
ACCOUNT_MANAGER
HR
REPORT_VIEWER

Example permissions:

ACCOUNT_VIEW
ACCOUNT_CREATE
ACCOUNT_EDIT

REQUIREMENT_VIEW
REQUIREMENT_CREATE
REQUIREMENT_EDIT
REQUIREMENT_ASSIGN

CANDIDATE_VIEW
CANDIDATE_UPLOAD
CANDIDATE_SEARCH
CANDIDATE_ASSIGN

INTERVIEW_VIEW
INTERVIEW_CREATE
INTERVIEW_UPDATE

REPORT_VIEW
REPORT_EXPORT
Important

Don't create dozens of roles just because different users need different access.

Role = collection of permissions.

Reporting hierarchy = organizational responsibility.

Data scope = which records the user can see.

These three should remain separate.

5. Phase 2 — Account Master

This is the second major module from your manager.

Your understanding is correct:

Account = customer/client company that your recruitment company is servicing.

Example:

Account
├── ABC Technologies - Chennai
├── XYZ Software - Bangalore
├── PQR Finance - Chennai
└── DEF Solutions - Hyderabad

If the business requirement says a new branch is treated as a separate account, we should support that.

Account fields

Initial version:

Account
├── ID
├── Display Name
├── Source
├── Key Account Person
├── Contact Person
├── Contact Email
├── Contact Number
├── Address
├── Status
├── Remarks
├── Created By
├── Created At
├── Updated By
└── Updated At
Important distinction

There are potentially three different people:

Account
│
├── Key Account Person
│      ↓
│   Internal employee
│
├── Contact Person
│      ↓
│   Customer employee
│
└── Recruiter
       ↓
    Internal employee

Don't combine these.

For example:

ABC Technologies

Key Account Person:
Ravi — Sales/Account Manager

Client Contact:
Kumar — ABC Technologies HR

Assigned Recruiter:
Selva — Recruitment Team

That will be extremely useful for reporting later.

6. Phase 3 — Requirement Master

This is probably the most important new business entity.

An Account is the customer.

A Requirement is what that customer currently needs.

Example:

ABC Technologies
      │
      ├── REQ-001 React Developer
      ├── REQ-002 Node.js Developer
      └── REQ-003 QA Engineer
Requirement fields
Requirement
├── Requirement ID
├── Account ID
├── Requirement Title
├── Job Description
├── Required Skills
├── Preferred Skills
├── Minimum Experience
├── Maximum Experience
├── Location
├── Number of Openings
├── Priority
├── Status
├── Assigned Manager
├── Assigned Recruiter
├── Open Date
├── Target Date
├── Closed Date
└── Remarks
7. Requirement History

Your manager specifically mentioned:

current requirement
history of requirement
description
remarks

So we should not simply update the requirement and destroy the old information.

Example:

REQ-001
React Developer

Version 1
────────────
Experience: 3–5 years
Openings: 3

Version 2
────────────
Experience: 2–5 years
Openings: 3

Version 3
────────────
Experience: 2–5 years
Openings: 5

History should capture:

Requirement History
├── Changed By
├── Changed At
├── Change Type
├── Previous Value
├── New Value
└── Remarks

This becomes very important when management asks:

"Why was this requirement delayed?"

or:

"When did the client change the requirement?"

8. Phase 4 — Connect Your Existing AI Engine

This is where your existing work becomes part of the actual recruitment workflow.

Current:

JD
 ↓
AI Parser
 ↓
Qdrant
 ↓
Candidate Ranking

New:

Account
   ↓
Requirement
   ↓
JD Parser
   ↓
AI Matching
   ↓
Ranked Candidates

So the requirement becomes the source of truth for candidate matching.

For example:

REQ-001
React Developer
ABC Technologies
5 openings

Required:
React
TypeScript
Node.js
PostgreSQL

        ↓

AI MATCHING

Candidate A    94%
Candidate B    91%
Candidate C    86%
Candidate D    79%

Your existing ranking engine can remain largely intact.

9. Phase 5 — Candidate ↔ Requirement Application

This is a very important database change.

Do not make:

Candidate → Requirement

Instead:

Candidate
    │
    ▼
Application
    │
    ▼
Requirement

Why?

Because one candidate can be considered for multiple jobs.

Example:

Candidate: Selva

Application 001
→ ABC Technologies
→ React Developer
→ Interview

Application 002
→ XYZ Technologies
→ Node.js Developer
→ Shortlisted

Application 003
→ PQR Technologies
→ Full Stack Developer
→ Rejected

Therefore the recruitment status belongs to the application, not the candidate globally.

10. Phase 6 — Recruitment Pipeline

Each application should have a pipeline.

Initial stages:

NEW
 ↓
SCREENING
 ↓
SHORTLISTED
 ↓
INTERVIEW
 ↓
SELECTED
 ↓
HIRED

Alternative exit:

REJECTED

Potentially later:

ON_HOLD
WITHDRAWN
OFFERED
JOINED

But don't add unnecessary stages now.

Start with the manager's requested flow.

11. Pipeline History

Don't store only:

status = INTERVIEW

We need history.

Example:

Application #APP-1024

10 Aug
NEW
Added by Selva

10 Aug
SCREENING
Updated by Selva

11 Aug
SHORTLISTED
Updated by Manager

12 Aug
INTERVIEW
Interview scheduled

14 Aug
SELECTED
Interview passed

This gives us:

timeline
accountability
audit
reporting
recruiter performance
12. Phase 7 — Assignment System

Now we need to answer:

Who is responsible for this requirement?

and:

Who is working on this candidate?

There should be assignment at different levels.

Account
Account
└── Key Account Person
Requirement
Requirement
├── Account Manager
├── Recruitment Manager
└── Recruiter
Candidate/Application
Application
├── Assigned Recruiter
└── Assigned Manager

This allows management reporting.

13. Phase 8 — Activity / Audit History

For a corporate recruitment system, this is essential.

Track events such as:

Candidate uploaded
Candidate assigned
Requirement created
Requirement edited
Candidate shortlisted
Candidate rejected
Interview scheduled
Interview completed
Candidate selected
Candidate hired

Example:

11 Aug 10:30
Selva

Candidate "John Doe"
moved from
SCREENING → SHORTLISTED

Requirement:
REQ-001

Reason:
Technical skills matched.

This eventually powers your dashboard and reports.

14. Phase 9 — Candidate Detail Page

Your existing ListPage and SearchPage should eventually lead into a proper candidate profile.

Something like:

Candidate Profile
────────────────────────────────────

John Doe
Senior React Developer
4.6 Years Experience

[Profile] [Resume] [Applications] [Activity]

Skills
React | TypeScript | Node.js | PostgreSQL

────────────────────────────────────

Applications

ABC Technologies
React Developer
Status: INTERVIEW
Match: 92%

XYZ Technologies
Full Stack Developer
Status: SHORTLISTED
Match: 87%

────────────────────────────────────

Experience

4.6 years
Current Company: XYZ Ltd

This becomes the central place for recruiters.

15. Phase 10 — Recruitment Dashboard

Your current dashboard has candidate metrics.

Now it should evolve into an operations dashboard.

Management view
Recruitment Dashboard

Active Accounts             42
Active Requirements         86
Open Positions             214

Candidates                 8,542
Screening                    632
Shortlisted                  284
Interviews                   146
Selected                      51
Hired                         39
Funnel
Candidates
    1000
     │
     ▼
Screening
     600
     │
     ▼
Shortlisted
     300
     │
     ▼
Interview
     180
     │
     ▼
Selected
      60
     │
     ▼
Hired
      45
16. Phase 11 — Reporting

This is one of your manager's major requirements.

We should design reports around the actual business hierarchy.

Account Report
Account Performance

Account
Active Requirements
Total Positions
Candidates Submitted
Shortlisted
Interviews
Selected
Hired
Open Positions
Time to Hire
Requirement Report
Requirement Report

Requirement
Account
Openings
Filled
Remaining
Candidates
Shortlisted
Interviews
Selected
Rejected
Days Open
Recruiter Report
Recruiter Performance

Recruiter
Requirements Assigned
Candidates Sourced
Candidates Submitted
Shortlisted
Interviews
Selections
Hires
Conversion Rate
Manager Report
Manager Performance

Manager
Team Size
Active Requirements
Candidates
Interviews
Selections
Hires
Team Conversion
17. Phase 12 — Export

Once reporting is stable:

Export
├── Excel
├── PDF
└── CSV

Reports can eventually be:

Account Report
Requirement Report
Recruiter Report
Manager Report
Candidate Pipeline Report
Hiring Report
18. Database Evolution

Your current database is roughly centered around:

Organization
Team
User
CandidateProfile
ResumeDocument

We should evolve it toward:

Organization
    │
    ├── User
    │    ├── Role
    │    ├── Permission
    │    └── Reporting User
    │
    ├── Account
    │    └── Account Contact
    │
    ├── Requirement
    │    ├── Requirement History
    │    └── Requirement Assignment
    │
    ├── CandidateProfile
    │    └── ResumeDocument
    │
    ├── Application
    │    └── Pipeline History
    │
    ├── Interview
    │
    ├── ActivityLog
    │
    └── Report
19. What We Should NOT Change Right Now

This is equally important.

Don't rebuild:
❌ MinIO
❌ PostgreSQL
❌ PyMuPDF
❌ Gemini profiling
❌ Experience calculation
❌ BGE embeddings
❌ Qdrant
❌ Hybrid search
❌ Skill matcher
❌ Ranking engine
❌ Existing resume upload pipeline

These are already valuable components.

Instead, we wrap them inside the new recruitment workflow.

20. Recommended Development Sequence

I recommend implementing in exactly this order:

                    CURRENT ATS
                         │
                         ▼
              ┌─────────────────────┐
              │ 1. ROLE & ACCESS    │
              │    MASTER            │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 2. USER / EMPLOYEE  │
              │    + REPORTING      │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 3. ACCOUNT MASTER   │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 4. REQUIREMENT      │
              │    MASTER           │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 5. REQUIREMENT      │
              │    HISTORY          │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 6. AI MATCHING      │
              │    INTEGRATION      │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 7. APPLICATION      │
              │    MODEL            │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 8. PIPELINE         │
              │    MANAGEMENT       │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 9. ASSIGNMENTS      │
              │    + ACTIVITY LOG   │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 10. INTERVIEW       │
              │     MANAGEMENT      │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 11. DASHBOARD       │
              │     & REPORTS       │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ 12. EXPORT /        │
              │     FULL REPORTING  │
              └─────────────────────┘
21. The Most Important Business Model

I would lock this into the project before writing the next migration:

USER
│
├── Role
├── Permissions
└── Reporting Manager
        │
        ▼
     ACCOUNT
        │
        ├── Key Account Person
        ├── Client Contacts
        │
        ▼
   REQUIREMENT
        │
        ├── JD
        ├── Requirement History
        ├── Assigned Manager
        ├── Assigned Recruiters
        │
        ▼
   APPLICATION
        │
        ├── Candidate
        ├── Match Score
        ├── Recruiter
        ├── Pipeline Status
        └── Pipeline History
                │
                ▼
           INTERVIEW
                │
                ▼
        SELECTED / REJECTED
                │
                ▼
              HIRED
In one sentence:

Account = client, Requirement = client's hiring need, Candidate = person, Application = candidate's consideration for that requirement, Pipeline = recruitment progress, User = employee responsible, Role/Permission = what they can do, Reporting = who manages whom.

That should be the core domain model for the next phase.

And importantly, your existing AI ranking engine becomes the mechanism that helps recruiters decide which candidates to move from the candidate pool into an application's NEW/SCREENING stage rather than being a standalone search feature.