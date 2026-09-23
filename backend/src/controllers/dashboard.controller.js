const prisma = require("../config/prisma");

exports.getDashboard = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [
      users,
      campaigns,
      activeCampaigns,
      completedCampaigns,
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

      prisma.campaign.count({
        where: {
          tenantId,
          status: "ACTIVE"
        }
      }),

      prisma.campaign.count({
        where: {
          tenantId,
          status: "COMPLETED"
        }
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
      activeCampaigns,
      completedCampaigns,
      criticalEvents,
      openEvents,
      recentActivity
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};