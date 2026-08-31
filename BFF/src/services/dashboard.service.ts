import { prisma } from "../config/prisma.js";

/* ─────────────────────────────────────────────────────────────
   GET /dashboard/summary
   High-level counts for Admin & Team Manager dashboards
   ───────────────────────────────────────────────────────────── */
export async function getSummary(userId: string, roleName: string, permissions: string[], organizationId: string | null) {
  // Common where clauses based on role/organization
  let userWhere: any = {};
  let reqWhere: any = {};
  let accountWhere: any = {};
  let appWhere: any = {};

  if (organizationId) {
    userWhere.organizationId = organizationId;
    reqWhere.organizationId = organizationId;
    accountWhere.organizationId = organizationId;
    appWhere.requirement = { organizationId: organizationId };
    
    // Use permissions to restrict scope instead of role name
    if (!permissions.includes("user:view")) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
      if (user?.teamId) {
        const teamUsers = await prisma.user.findMany({ where: { teamId: user.teamId }, select: { id: true } });
        const teamUserIds = teamUsers.map((u) => u.id);
        appWhere.assignedRecruiterId = { in: teamUserIds };
      } else {
        appWhere.assignedRecruiterId = userId;
      }
    }
  }

  // 1. Core KPIs
  const [activeAccounts, activeRequirements, openPositionsAgg, totalCandidates] = await Promise.all([
    prisma.account.count({
      where: { ...accountWhere, status: "ACTIVE" },
    }),
    prisma.requirement.count({
      where: { ...reqWhere, status: "OPEN" },
    }),
    prisma.requirement.aggregate({
      _sum: { numberOfOpenings: true },
      where: { ...reqWhere, status: "OPEN" },
    }),
    prisma.candidateProfile.count({
      where: userWhere, // We can just count org-level candidates
    }),
  ]);

  const openPositions = openPositionsAgg._sum.numberOfOpenings || 0;

  // 2. Application Funnel Counts
  const statusCounts = await prisma.application.groupBy({
    by: ["status"],
    _count: { status: true },
    where: appWhere,
  });

  const funnelMap: Record<string, number> = {};
  statusCounts.forEach((s) => {
    funnelMap[s.status] = s._count.status;
  });

  // Include Total Managers/Teams for ADMIN
  let totalManagers = 0;
  let totalTeams = 0;
  if (!organizationId) {
    totalManagers = await prisma.user.count({ where: { role: { name: "TEAM_MANAGER" } } });
    totalTeams = await prisma.team.count();
  }

  return {
    activeAccounts,
    activeRequirements,
    openPositions,
    totalCandidates,
    funnelBreakdown: funnelMap,
    ...(!organizationId && { totalManagers, totalTeams }),
  };
}

/* ─────────────────────────────────────────────────────────────
   GET /dashboard/managers  (Admin only)
   List all Team Managers with stats
   ───────────────────────────────────────────────────────────── */
export async function getManagers() {
  const managers = await prisma.user.findMany({
    where: { role: { name: "TEAM_MANAGER" } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      teamId: true,
      team: { select: { name: true } },
      createdAt: true,
      _count: {
        select: {
          managedCandidates: true,
          createdCandidates: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return managers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    teamId: m.teamId,
    teamName: m.team?.name ?? null,
    candidateCount: m._count.managedCandidates,
    uploadedCount: m._count.createdCandidates,
    joinedAt: m.createdAt,
  }));
}

/* ─────────────────────────────────────────────────────────────
   GET /dashboard/teams  (Admin only)
   List all teams with member + candidate counts
   ───────────────────────────────────────────────────────────── */
export async function getTeams() {
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: {
          users: true,
        },
      },
      users: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get candidate counts per team by looking at managers' assigned candidates
  const result = await Promise.all(
    teams.map(async (team) => {
      const managerIds = team.users.map((u) => u.id);
      const candidateCount =
        managerIds.length > 0
          ? await prisma.candidateProfile.count({
              where: { assignedManagerId: { in: managerIds } },
            })
          : 0;

      return {
        id: team.id,
        name: team.name,
        organizationId: team.organizationId,
        memberCount: team._count.users,
        candidateCount,
        createdAt: team.createdAt,
      };
    })
  );

  return result;
}

/* ─────────────────────────────────────────────────────────────
   GET /dashboard/activity
   Recent candidate activity (uploads, status changes)
   ───────────────────────────────────────────────────────────── */
export async function getActivity(userId: string, roleName: string, permissions: string[], organizationId: string | null, limit = 20) {
  let whereClause: any = {};
  if (organizationId) {
    whereClause = { organizationId };
  }

  const logs = await prisma.activityLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      performedBy: {
        select: { name: true, email: true },
      },
    },
  });

  return logs.map((log: any) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    performedBy: log.performedBy?.name ?? log.performedBy?.email ?? "System",
    createdAt: log.createdAt,
  }));
}
