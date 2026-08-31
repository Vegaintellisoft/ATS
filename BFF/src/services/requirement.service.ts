import { prisma } from "../config/prisma.js";

const REQUIREMENT_SELECT = {
  id: true,
  requirementCode: true,
  accountId: true,
  account: { select: { id: true, displayName: true } },
  title: true,
  jobDescription: true,
  requiredSkills: true,
  preferredSkills: true,
  minExperience: true,
  maxExperience: true,
  location: true,
  numberOfOpenings: true,
  priority: true,
  status: true,
  assignedManagerId: true,
  assignedManager: { select: { id: true, name: true, email: true } },
  assignedRecruiterId: true,
  assignedRecruiter: { select: { id: true, name: true, email: true } },
  openDate: true,
  targetDate: true,
  closedDate: true,
  remarks: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

export async function getRequirements(organizationId: string) {
  return await prisma.requirement.findMany({
    where: { organizationId },
    select: REQUIREMENT_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequirementById(id: string) {
  return await prisma.requirement.findUnique({
    where: { id },
    select: REQUIREMENT_SELECT,
  });
}

function generateCode() {
  return `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createRequirement(data: {
  accountId: string;
  title: string;
  jobDescription: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minExperience?: number;
  maxExperience?: number;
  location?: string;
  numberOfOpenings?: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "OPEN" | "ON_HOLD" | "CLOSED" | "CANCELLED";
  assignedManagerId?: string;
  assignedRecruiterId?: string;
  targetDate?: Date;
  remarks?: string;
  organizationId: string;
  createdById: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.requirement.create({
      data: {
        ...data,
        requirementCode: generateCode(),
      },
      select: REQUIREMENT_SELECT,
    });

    await tx.requirementHistory.create({
      data: {
        requirementId: req.id,
        changedById: data.createdById,
        changeType: "CREATE",
        remarks: "Requirement Created",
      },
    });

    return req;
  });
}

export async function updateRequirement(id: string, data: Partial<{
  title: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number;
  maxExperience: number;
  location: string;
  numberOfOpenings: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "ON_HOLD" | "CLOSED" | "CANCELLED";
  assignedManagerId: string | null;
  assignedRecruiterId: string | null;
  targetDate: Date | null;
  closedDate: Date | null;
  remarks: string;
  changedById: string;
}>) {
  const existing = await prisma.requirement.findUnique({ where: { id } });
  if (!existing) throw new Error("Requirement not found");

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.requirement.update({
      where: { id },
      data: {
        title: data.title,
        jobDescription: data.jobDescription,
        requiredSkills: data.requiredSkills,
        preferredSkills: data.preferredSkills,
        minExperience: data.minExperience,
        maxExperience: data.maxExperience,
        location: data.location,
        numberOfOpenings: data.numberOfOpenings,
        priority: data.priority,
        status: data.status,
        assignedManagerId: data.assignedManagerId,
        assignedRecruiterId: data.assignedRecruiterId,
        targetDate: data.targetDate,
        closedDate: data.closedDate,
        remarks: data.remarks,
      },
      select: REQUIREMENT_SELECT,
    });

    // Determine changes
    const historyEntries = [];

    // Status change
    if (data.status && data.status !== existing.status) {
      let changeType = "STATUS_CHANGE";
      if (data.status === "CLOSED") changeType = "CLOSED";
      if (data.status === "CANCELLED") changeType = "CANCELLED";
      if (existing.status === "CLOSED" || existing.status === "CANCELLED" || existing.status === "ON_HOLD") {
        if (data.status === "OPEN") changeType = "REOPENED";
      }

      historyEntries.push({
        requirementId: id,
        changedById: data.changedById!,
        changeType,
        field: "status",
        previousValue: existing.status,
        newValue: data.status,
      });
    }

    // Assignment change (Recruiter)
    if (data.assignedRecruiterId !== undefined && data.assignedRecruiterId !== existing.assignedRecruiterId) {
      historyEntries.push({
        requirementId: id,
        changedById: data.changedById!,
        changeType: "ASSIGNMENT_CHANGE",
        field: "assignedRecruiterId",
        previousValue: existing.assignedRecruiterId || "Unassigned",
        newValue: data.assignedRecruiterId || "Unassigned",
      });
    }

    // Assignment change (Manager)
    if (data.assignedManagerId !== undefined && data.assignedManagerId !== existing.assignedManagerId) {
      historyEntries.push({
        requirementId: id,
        changedById: data.changedById!,
        changeType: "ASSIGNMENT_CHANGE",
        field: "assignedManagerId",
        previousValue: existing.assignedManagerId || "Unassigned",
        newValue: data.assignedManagerId || "Unassigned",
      });
    }

    // Field updates (example: minExperience)
    if (data.minExperience !== undefined && data.minExperience !== existing.minExperience) {
      historyEntries.push({
        requirementId: id,
        changedById: data.changedById!,
        changeType: "FIELD_UPDATE",
        field: "minExperience",
        previousValue: existing.minExperience?.toString() || "None",
        newValue: data.minExperience?.toString() || "None",
      });
    }
    
    // Field updates (example: maxExperience)
    if (data.maxExperience !== undefined && data.maxExperience !== existing.maxExperience) {
      historyEntries.push({
        requirementId: id,
        changedById: data.changedById!,
        changeType: "FIELD_UPDATE",
        field: "maxExperience",
        previousValue: existing.maxExperience?.toString() || "None",
        newValue: data.maxExperience?.toString() || "None",
      });
    }

    if (historyEntries.length > 0) {
      await tx.requirementHistory.createMany({
        data: historyEntries,
      });
    } else {
      // If we got here with no specific field tracking caught, log a generic update
      await tx.requirementHistory.create({
        data: {
          requirementId: id,
          changedById: data.changedById!,
          changeType: "FIELD_UPDATE",
          remarks: "Requirement updated",
        },
      });
    }

    return updated;
  });
}

export async function deleteRequirement(id: string) {
  return await prisma.requirement.delete({
    where: { id },
  });
}

export async function getRequirementHistory(requirementId: string) {
  return await prisma.requirementHistory.findMany({
    where: { requirementId },
    orderBy: { changedAt: "desc" },
    include: {
      changedBy: { select: { name: true, email: true } },
    }
  });
}
