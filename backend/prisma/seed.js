const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean (order matters because of FKs)
  await prisma.auditLog.deleteMany();
  await prisma.campaignUser.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Tenants
  const tenantA = await prisma.tenant.create({
    data: { name: "Acme Corp" }
  });

  const tenantB = await prisma.tenant.create({
    data: { name: "Globex Inc" }
  });

  console.log(
    `Tenants: ${tenantA.name} (id ${tenantA.id}), ${tenantB.name} (id ${tenantB.id})`
  );

  // Users (all password: password123)
  const passwordHash = await bcrypt.hash("password123", 10);

  const adminA = await prisma.user.create({
    data: {
      name: "Alice Admin",
      email: "admin@acme.com",
      passwordHash,
      role: "ADMIN",
      tenantId: tenantA.id
    }
  });

  const managerA = await prisma.user.create({
    data: {
      name: "Manny Manager",
      email: "manager@acme.com",
      passwordHash,
      role: "MANAGER",
      tenantId: tenantA.id
    }
  });

  const userA = await prisma.user.create({
    data: {
      name: "Uma User",
      email: "user@acme.com",
      passwordHash,
      role: "USER",
      tenantId: tenantA.id
    }
  });

  const adminB = await prisma.user.create({
    data: {
      name: "Bob Boss",
      email: "admin@globex.com",
      passwordHash,
      role: "ADMIN",
      tenantId: tenantB.id
    }
  });

  console.log("Users created:");
  console.log("  admin@acme.com    / password123  (ADMIN,   Acme)");
  console.log("  manager@acme.com  / password123  (MANAGER, Acme)");
  console.log("  user@acme.com     / password123  (USER,    Acme)");
  console.log("  admin@globex.com  / password123  (ADMIN,   Globex)");

  // Campaigns
  const c1 = await prisma.campaign.create({
    data: {
      name: "Q1 Phishing Awareness",
      description: "Company-wide phishing training and simulated attacks.",
      status: "DRAFT",
      tenantId: tenantA.id,
      createdById: adminA.id
    }
  });

  const c2 = await prisma.campaign.create({
    data: {
      name: "Password Hygiene Q2",
      description: "Password strength audit and rotation policy rollout.",
      status: "ACTIVE",
      tenantId: tenantA.id,
      createdById: managerA.id
    }
  });

  const c3 = await prisma.campaign.create({
    data: {
      name: "Endpoint Hardening",
      description: "Deploy EDR and harden all endpoints.",
      status: "COMPLETED",
      tenantId: tenantA.id,
      createdById: adminA.id
    }
  });

  // Tenant B campaign — used to prove cross-tenant isolation
  await prisma.campaign.create({
    data: {
      name: "Tenant B Secret Campaign",
      description: "Must never be visible to Tenant A users.",
      status: "ACTIVE",
      tenantId: tenantB.id,
      createdById: adminB.id
    }
  });

  console.log("Campaigns created");

  // Assignments
  await prisma.campaignUser.createMany({
    data: [
      { campaignId: c2.id, userId: managerA.id },
      { campaignId: c2.id, userId: userA.id },
      { campaignId: c3.id, userId: userA.id }
    ]
  });

  console.log("Campaign assignments created");

  // Security Events
  await prisma.securityEvent.createMany({
    data: [
      {
        eventType: "Unauthorized Access Attempt",
        severity: "HIGH",
        status: "OPEN",
        description: "Multiple failed logins from 203.0.113.42.",
        tenantId: tenantA.id
      },
      {
        eventType: "Malware Detected",
        severity: "CRITICAL",
        status: "IN_PROGRESS",
        description: "Trojan detected on workstation WKS-118.",
        tenantId: tenantA.id
      },
      {
        eventType: "Phishing Email Reported",
        severity: "MEDIUM",
        status: "RESOLVED",
        description: "User reported suspicious email. Verified benign.",
        tenantId: tenantA.id
      },
      {
        eventType: "Firewall Rule Change",
        severity: "LOW",
        status: "CLOSED",
        description: "Routine firewall rule update.",
        tenantId: tenantA.id
      }
    ]
  });

  console.log("Security events created");

  // Audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        action: "LOGIN",
        entity: "USER",
        entityId: adminA.id,
        userId: adminA.id,
        tenantId: tenantA.id
      },
      {
        action: "CREATE_CAMPAIGN",
        entity: "CAMPAIGN",
        entityId: c1.id,
        userId: adminA.id,
        tenantId: tenantA.id
      },
      {
        action: "CREATE_CAMPAIGN",
        entity: "CAMPAIGN",
        entityId: c2.id,
        userId: managerA.id,
        tenantId: tenantA.id
      }
    ]
  });

  console.log("Audit logs created");
  console.log("");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });