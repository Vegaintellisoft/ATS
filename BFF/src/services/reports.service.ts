import { prisma } from "../config/prisma.js";

// Helper for filtering by organization/role hierarchy
async function getScopeWhere(userId: string, roleName: string, orgId?: string) {
  let where: any = {};
  if (roleName !== "ADMIN") {
    where.organizationId = orgId;
    if (roleName === "TEAM_MANAGER" || roleName === "TEAM_MEMBER") {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
      if (user?.teamId) {
        const teamUsers = await prisma.user.findMany({ where: { teamId: user.teamId }, select: { id: true } });
        const teamUserIds = teamUsers.map((u) => u.id);
        where.assignedManagerId = { in: teamUserIds };
      } else {
        where.assignedManagerId = userId;
      }
    } else if (roleName === "RECRUITER") {
      where.assignedRecruiterId = userId;
    }
  }
  return where;
}

export async function getAccountReport(userId: string, roleName: string, orgId?: string) {
  const scopeWhere = await getScopeWhere(userId, roleName, orgId);
  const accounts = await prisma.account.findMany({
    where: roleName !== "ADMIN" ? { organizationId: orgId } : {},
    include: {
      requirements: {
        where: scopeWhere,
        include: { applications: true },
      },
    },
  });

  return accounts.map((acc) => {
    let activeReqs = 0;
    let totalPositions = 0;
    let submitted = 0;
    let shortlisted = 0;
    let interviews = 0;
    let selected = 0;
    let hired = 0;

    acc.requirements.forEach((req) => {
      if (req.status === "OPEN") activeReqs++;
      totalPositions += req.numberOfOpenings;
      submitted += req.applications.length;
      
      req.applications.forEach((app) => {
        if (app.status === "SHORTLISTED") shortlisted++;
        if (app.status === "INTERVIEW") interviews++;
        if (app.status === "SELECTED") selected++;
        if (app.status === "HIRED") hired++;
      });
    });

    return {
      accountId: acc.id,
      accountName: acc.displayName,
      activeRequirements: activeReqs,
      totalPositions,
      candidatesSubmitted: submitted,
      shortlisted,
      interviews,
      selected,
      hired,
      openPositions: Math.max(0, totalPositions - hired),
    };
  });
}

export async function getRequirementReport(userId: string, roleName: string, orgId?: string) {
  const scopeWhere = await getScopeWhere(userId, roleName, orgId);
  const requirements = await prisma.requirement.findMany({
    where: scopeWhere,
    include: {
      account: { select: { displayName: true } },
      applications: true,
    },
  });

  return requirements.map((req) => {
    let shortlisted = 0;
    let interviews = 0;
    let selected = 0;
    let hired = 0;
    let rejected = 0;

    req.applications.forEach((app) => {
      if (app.status === "SHORTLISTED") shortlisted++;
      if (app.status === "INTERVIEW") interviews++;
      if (app.status === "SELECTED") selected++;
      if (app.status === "HIRED") hired++;
      if (app.status === "REJECTED") rejected++;
    });

    const daysOpen = req.closedDate 
      ? Math.floor((new Date(req.closedDate).getTime() - new Date(req.openDate).getTime()) / (1000 * 3600 * 24))
      : Math.floor((new Date().getTime() - new Date(req.openDate).getTime()) / (1000 * 3600 * 24));

    return {
      requirementId: req.id,
      code: req.requirementCode,
      title: req.title,
      accountName: req.account.displayName,
      openings: req.numberOfOpenings,
      filled: hired,
      remaining: Math.max(0, req.numberOfOpenings - hired),
      candidates: req.applications.length,
      shortlisted,
      interviews,
      selected,
      rejected,
      daysOpen,
    };
  });
}

export async function getRecruiterReport(userId: string, roleName: string, orgId?: string) {
  let where: any = {};
  if (roleName !== "ADMIN") where.organizationId = orgId;
  
  // A manager sees their team's recruiters, a recruiter sees themselves
  if (roleName === "TEAM_MANAGER" || roleName === "TEAM_MEMBER") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    if (user?.teamId) {
      where.teamId = user.teamId;
    } else {
      where.id = userId;
    }
  } else if (roleName === "RECRUITER") {
    where.id = userId;
  }

  const recruiters = await prisma.user.findMany({
    where: { ...where, role: { name: { in: ["RECRUITER", "TEAM_MEMBER", "TEAM_MANAGER"] } } },
    include: {
      assignedRequirements: { select: { id: true } },
      createdCandidates: { select: { id: true } },
      assignedApplications: true,
    },
  });

  return recruiters.map((rec) => {
    let shortlisted = 0;
    let interviews = 0;
    let selected = 0;
    let hired = 0;

    rec.assignedApplications.forEach((app) => {
      if (app.status === "SHORTLISTED") shortlisted++;
      if (app.status === "INTERVIEW") interviews++;
      if (app.status === "SELECTED") selected++;
      if (app.status === "HIRED") hired++;
    });

    const submitted = rec.assignedApplications.length;
    const conversionRate = submitted > 0 ? (hired / submitted) * 100 : 0;

    return {
      recruiterId: rec.id,
      name: rec.name || rec.email,
      requirementsAssigned: rec.assignedRequirements.length,
      candidatesSourced: rec.createdCandidates.length,
      candidatesSubmitted: submitted,
      shortlisted,
      interviews,
      selected,
      hired,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
    };
  });
}

export async function getManagerReport(userId: string, roleName: string, orgId?: string) {
  let where: any = { role: { name: "TEAM_MANAGER" } };
  if (roleName !== "ADMIN") {
    where.organizationId = orgId;
    if (roleName === "TEAM_MANAGER") {
      where.id = userId;
    }
  }

  const managers = await prisma.user.findMany({
    where,
    include: {
      team: {
        include: {
          users: {
            include: {
              createdCandidates: { select: { id: true } },
              assignedApplications: true,
            }
          }
        }
      },
      managedRequirements: { select: { id: true, status: true } },
    },
  });

  return managers.map((mgr) => {
    let sourced = 0;
    let submitted = 0;
    let interviews = 0;
    let selected = 0;
    let hired = 0;

    const teamSize = mgr.team?.users.length || 0;
    const activeReqs = mgr.managedRequirements.filter(r => r.status === "OPEN").length;

    mgr.team?.users.forEach((user) => {
      sourced += user.createdCandidates.length;
      submitted += user.assignedApplications.length;
      user.assignedApplications.forEach((app) => {
        if (app.status === "INTERVIEW") interviews++;
        if (app.status === "SELECTED") selected++;
        if (app.status === "HIRED") hired++;
      });
    });

    const conversionRate = submitted > 0 ? (hired / submitted) * 100 : 0;

    return {
      managerId: mgr.id,
      name: mgr.name || mgr.email,
      teamSize,
      activeRequirements: activeReqs,
      candidatesSourced: sourced,
      candidatesSubmitted: submitted,
      interviews,
      selected,
      hired,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
    };
  });
}
