import { prisma } from "../config/prisma.js";
import { logActivity } from "./activityLog.service.js";
import { ApplicationStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  NEW: ["SCREENING", "REJECTED"],
  SCREENING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["SELECTED", "REJECTED"],
  SELECTED: ["HIRED", "REJECTED"],
  REJECTED: [],
  HIRED: [],
};

function generateApplicationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "APP-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createApplication(data: {
  candidateId: string;
  requirementId: string;
  organizationId: string;
  createdById: string;
  matchScore?: number;
}) {
  const application = await prisma.$transaction(async (tx) => {
    // Check if it already exists
    const existing = await tx.application.findUnique({
      where: {
        candidateId_requirementId: {
          candidateId: data.candidateId,
          requirementId: data.requirementId,
        }
      }
    });

    if (existing) {
      throw new Error("Candidate is already applied to this requirement");
    }

    const appCode = generateApplicationCode();

    const app = await tx.application.create({
      data: {
        applicationCode: appCode,
        candidateId: data.candidateId,
        requirementId: data.requirementId,
        organizationId: data.organizationId,
        createdById: data.createdById,
        matchScore: data.matchScore,
        status: "NEW",
      },
      include: {
        candidate: { select: { id: true, profile: true } },
        requirement: { select: { id: true, title: true } }
      }
    });

    // Record initial history
    await tx.pipelineHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: "NONE",
        toStatus: "NEW",
        changedById: data.createdById,
        remarks: "Application created",
      }
    });

    return app;
  });

  // Log activity outside transaction
  await logActivity({
    action: "APPLICATION_CREATED",
    entityType: "Application",
    entityId: application.id,
    performedById: data.createdById,
    organizationId: data.organizationId,
    details: {
      candidateId: data.candidateId,
      requirementId: data.requirementId,
    }
  });

  return application;
}

export async function updateApplicationStatus(data: {
  applicationId: string;
  newStatus: ApplicationStatus;
  changedById: string;
  organizationId: string;
  remarks?: string;
}) {
  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: data.applicationId },
    });

    if (!app) {
      throw new Error("Application not found");
    }

    if (app.organizationId !== data.organizationId) {
      throw new Error("Forbidden");
    }

    const validNextStates = VALID_TRANSITIONS[app.status];
    if (!validNextStates.includes(data.newStatus)) {
      throw new Error(`Invalid transition from ${app.status} to ${data.newStatus}`);
    }

    const updated = await tx.application.update({
      where: { id: data.applicationId },
      data: { status: data.newStatus },
      include: {
        candidate: { select: { id: true, profile: true } },
        requirement: { select: { id: true, title: true } }
      }
    });

    await tx.pipelineHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: data.newStatus,
        changedById: data.changedById,
        remarks: data.remarks,
      }
    });

    return { updated, oldStatus: app.status };
  });

  await logActivity({
    action: "PIPELINE_MOVED",
    entityType: "Application",
    entityId: application.updated.id,
    performedById: data.changedById,
    organizationId: data.organizationId,
    details: {
      fromStatus: application.oldStatus,
      toStatus: data.newStatus,
      remarks: data.remarks,
    }
  });

  return application.updated;
}

export async function getApplicationsForRequirement(requirementId: string, organizationId: string) {
  return prisma.application.findMany({
    where: { requirementId, organizationId },
    include: {
      candidate: {
        select: {
          id: true,
          documentId: true,
          profile: true,
          totalExperienceYears: true,
        }
      },
      assignedRecruiter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicationPipelineHistory(applicationId: string, organizationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { organizationId: true },
  });

  if (!app || app.organizationId !== organizationId) {
    throw new Error("Application not found");
  }

  return prisma.pipelineHistory.findMany({
    where: { applicationId },
    orderBy: { changedAt: "desc" },
    include: {
      changedBy: { select: { id: true, name: true, email: true } }
    }
  });
}

export async function getAllApplications(organizationId: string) {
  const applications = await prisma.application.findMany({
    where: { organizationId },
    select: {
      id: true,
      applicationCode: true,
      matchScore: true,
      status: true,
      createdAt: true,
      candidate: {
        select: {
          id: true,
          profile: true,
        }
      },
      requirement: {
        select: {
          id: true,
          title: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return applications.map(app => {
    let candidateName = "Unknown";
    if (app.candidate.profile && typeof app.candidate.profile === 'object' && 'name' in app.candidate.profile) {
      candidateName = (app.candidate.profile as any).name || "Unknown";
    }
    
    return {
      id: app.id,
      appCode: app.applicationCode,
      candidate: {
        id: app.candidate.id,
        name: candidateName,
      },
      requirement: {
        id: app.requirement.id,
        title: app.requirement.title,
      },
      matchScore: app.matchScore,
      status: app.status,
      appliedAt: app.createdAt,
    };
  });
}
