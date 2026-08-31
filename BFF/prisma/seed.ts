import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* ─────────────────────────────────────────────────────────────
   Full permission set — Standardized naming convention
   ───────────────────────────────────────────────────────────── */
const PERMISSIONS = [
  "organization:view", "organization:create", "organization:update", "organization:delete",
  "team:view", "team:create", "team:update", "team:delete",
  "user:view", "user:create", "user:update", "user:delete",
  "candidate:view", "candidate:create", "candidate:update", "candidate:delete",
  "resume:view", "resume:upload", "resume:download", "resume:delete",
  "requirement:view", "requirement:create", "requirement:update", "requirement:delete",
  "application:view", "application:create", "application:update", "application:delete",
  "report:view", "report:export",
  "dashboard:view",
  "account:view", "account:create", "account:update", "account:delete",
  "role:manage",
];

/* ─────────────────────────────────────────────────────────────
   Roles — Explicit permission matrix based on user feedback
   ───────────────────────────────────────────────────────────── */
const ROLES = [
  {
    name: "ADMIN",
    description: "Platform administrator — full access",
    permissions: PERMISSIONS, // Admin gets everything
  },
  {
    name: "TEAM_MANAGER",
    description: "Team manager — manages own candidates (legacy)",
    permissions: [
      "candidate:view", "candidate:create", "candidate:update", "candidate:delete",
      "resume:view", "resume:upload", "resume:download",
      "dashboard:view",
      "team:view",
      "user:view",
      "account:view",
      "requirement:view",
      "application:view",
      "report:view",
    ],
  },
  {
    name: "TEAM_MEMBER",
    description: "Team member — works under a manager (legacy)",
    permissions: [
      "candidate:view", "candidate:create", "candidate:update",
      "resume:view", "resume:upload", "resume:download",
      "dashboard:view",
      "team:view",
      "account:view",
      "requirement:view",
      "application:view",
    ],
  },
  {
    name: "RECRUITMENT_MANAGER",
    description: "Manages recruiters, requirements, and accounts",
    permissions: [
      "candidate:view", "candidate:create", "candidate:update", "candidate:delete",
      "resume:view", "resume:upload", "resume:download", "resume:delete",
      "requirement:view", "requirement:create", "requirement:update",
      "application:view", "application:create", "application:update",
      "account:view", "account:create", "account:update",
      "team:view",
      "user:view",
      "dashboard:view",
      "report:view", "report:export",
    ],
  },
  {
    name: "RECRUITER",
    description: "Handles day-to-day recruitment — sourcing, screening, scheduling",
    permissions: [
      "candidate:view", "candidate:create", "candidate:update",
      "resume:view", "resume:upload", "resume:download",
      "requirement:view", "requirement:update",
      "application:view", "application:create", "application:update",
      "account:view",
      "team:view",
      "dashboard:view",
      "report:view",
    ],
  },
  {
    name: "ACCOUNT_MANAGER",
    description: "Manages client accounts and relationships",
    permissions: [
      "account:view", "account:create", "account:update",
      "requirement:view", "requirement:create", "requirement:update",
      "candidate:view",
      "application:view",
      "dashboard:view",
      "report:view",
    ],
  },
  {
    name: "HR",
    description: "Handles post-selection onboarding and hiring",
    permissions: [
      "candidate:view",
      "requirement:view",
      "application:view", "application:update",
      "dashboard:view",
      "report:view",
    ],
  },
  {
    name: "REPORT_VIEWER",
    description: "Read-only access to dashboards and reports",
    permissions: [
      "dashboard:view",
      "report:view", "report:export",
      "account:view",
      "requirement:view",
      "candidate:view",
      "application:view",
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Seed users — dev accounts
   ───────────────────────────────────────────────────────────── */
const SEED_USERS = [
  { email: "admin@ats.dev", password: "password", roleName: "ADMIN", name: "Admin" },
  { email: "manager@ats.dev", password: "password", roleName: "TEAM_MANAGER", name: "John Manager" },
  { email: "member@ats.dev", password: "password", roleName: "TEAM_MEMBER", name: "Jane Member" },
  { email: "recruiter@ats.dev", password: "password", roleName: "RECRUITER", name: "Selva Recruiter" },
  { email: "rm@ats.dev", password: "password", roleName: "RECRUITMENT_MANAGER", name: "Ravi RM" },
];

async function main() {
  // 1. Seed permissions
  console.log("🌱 Seeding permissions...");
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Permission for ${key}` },
    });
  }

  // 2. Seed roles
  console.log("🌱 Seeding roles...");
  for (const roleDef of ROLES) {
    let role = await prisma.role.findFirst({
      where: { name: roleDef.name, organizationId: null },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.description,
        },
      });
    } else {
      // Update description in case it changed
      role = await prisma.role.update({
        where: { id: role.id },
        data: { description: roleDef.description },
      });
    }

    // Assign permissions
    const permissions = await prisma.permission.findMany({
      where: { key: { in: roleDef.permissions } },
    });

    for (const p of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: p.id,
        },
      });
    }

    console.log(`  ✓ Role ${role.name} (${permissions.length} permissions)`);
  }

  // 3. Seed default organization
  console.log("🌱 Seeding default organization...");
  let defaultOrg = await prisma.organization.findFirst({ where: { slug: "platform" } });
  if (!defaultOrg) {
    defaultOrg = await prisma.organization.create({
      data: { name: "Platform", slug: "platform" },
    });
    console.log(`  ✓ Created default org: ${defaultOrg.name} (${defaultOrg.id})`);
  } else {
    console.log(`  ✓ Default org already exists: ${defaultOrg.name}`);
  }

  // 4. Seed users
  console.log("🌱 Seeding users...");
  for (const userDef of SEED_USERS) {
    const role = await prisma.role.findFirst({
      where: { name: userDef.roleName, organizationId: null },
    });

    if (!role) {
      console.error(`Role ${userDef.roleName} not found!`);
      continue;
    }

    const hashed = await bcrypt.hash(userDef.password, 10);

    const upserted = await prisma.user.upsert({
      where: { email: userDef.email },
      update: { roleId: role.id, password: hashed, name: userDef.name, organizationId: defaultOrg.id },
      create: {
        email: userDef.email,
        password: hashed,
        roleId: role.id,
        name: userDef.name,
        organizationId: defaultOrg.id,
      },
    });

    console.log(`  ✓ ${role.name.padEnd(22)} → ${upserted.email}`);
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
