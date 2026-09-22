const prisma = require("../config/prisma");

exports.getDashboard = async (req, res) => {

  const tenantId = req.user.tenantId;

  const [
    users,
    campaigns,
    criticalEvents,
    openEvents,
    recentActivity
  ] = await Promise.all([

    prisma.user.count({
      where: { tenantId }
    }),

    prisma.campaign.count({
      where: { tenantId }
    }),

    prisma.securityEvent.count({
      where: {
        tenantId,
        severity: "CRITICAL"
      }
    }),

    prisma.securityEvent.count({
      where: {
        tenantId,
        status: "OPEN"
      }
    }),

    prisma.auditLog.findMany({
      where: { tenantId },
      take: 10,
      orderBy: {
        createdAt: "desc"
      }
    })

  ]);

  res.json({
    users,
    campaigns,
    criticalEvents,
    openEvents,
    recentActivity
  });
};