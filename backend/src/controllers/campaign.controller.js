const prisma = require("../config/prisma");

// ---------------------------------------------------------
// STATUS TRANSITION RULES
// ---------------------------------------------------------
const ALLOWED_TRANSITIONS = {
  DRAFT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

const STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"];

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
const isValidStatus = (status) => STATUSES.includes(status);

const canTransition = (current, next) => {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
};

const writeAuditLog = async ({
  action,
  entityId,
  userId,
  tenantId
}) => {
  await prisma.auditLog.create({
    data: {
      action,
      entity: "CAMPAIGN",
      entityId,
      userId,
      tenantId
    }
  });
};

// ---------------------------------------------------------
// CREATE CAMPAIGN
// ---------------------------------------------------------
exports.createCampaign = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required"
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: "DRAFT",
        tenantId: req.user.tenantId
      }
    });

    await writeAuditLog({
      action: "CREATE_CAMPAIGN",
      entityId: campaign.id,
      userId: req.user.userId,
      tenantId: req.user.tenantId
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
// ---------------------------------------------------------
// GET ALL CAMPAIGNS (paginated)
// ---------------------------------------------------------
exports.getCampaigns = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const where = {
      tenantId: req.user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------
// GET CAMPAIGN BY ID (with assigned users)
// ---------------------------------------------------------
exports.getCampaignById = async (req, res) => {
  try {
    const campaignId = Number(req.params.id);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId: req.user.tenantId,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Map to the shape the frontend expects: { campaignId, userId, user }
    const result = {
      ...campaign,
      users: (campaign.users || []).map((cu) => ({
        campaignId: cu.campaignId,
        userId: cu.userId,
        user: cu.user,
      })),
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------
// CREATE CAMPAIGN
// ---------------------------------------------------------
exports.createCampaign = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required",
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: "DRAFT",
        tenantId: req.user.tenantId,
      },
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.updateCampaign = async (req, res) => {
  try {
    const campaignId = Number(req.params.id);
    const { name, description, status } = req.body;

    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: req.user.tenantId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Validate status transition
    if (status && status !== existing.status) {
      const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${existing.status} to ${status}`,
        });
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------
// DELETE CAMPAIGN
// ---------------------------------------------------------
exports.deleteCampaign = async (req, res) => {
  try {
    const campaignId = Number(req.params.id);

    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: req.user.tenantId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Delete related assignments first (if no cascade in schema)
    await prisma.campaignUser.deleteMany({
      where: { campaignId },
    });

    await prisma.campaign.delete({ where: { id: campaignId } });

    res.json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------
// ASSIGN USER TO CAMPAIGN
// ---------------------------------------------------------
exports.assignUser = async (req, res) => {
  try {
    const campaignId = Number(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const numericUserId = Number(userId);

    // Verify campaign belongs to tenant
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: req.user.tenantId },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: { id: numericUserId, tenantId: req.user.tenantId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check existing assignment
    const existing = await prisma.campaignUser.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: numericUserId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already assigned to this campaign",
      });
    }

    const assignment = await prisma.campaignUser.create({
      data: { campaignId, userId: numericUserId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({
      campaignId: assignment.campaignId,
      userId: assignment.userId,
      user: assignment.user,
    });
  } catch (err) {
    console.error("assignUser error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ---------------------------------------------------------
// REMOVE USER FROM CAMPAIGN
// ---------------------------------------------------------
exports.removeUser = async (req, res) => {
  try {
    const campaignId = Number(req.params.id);
    const userId = Number(req.params.userId);

    if (Number.isNaN(campaignId) || Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaignId or userId",
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: req.user.tenantId },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check the assignment exists
    const existing = await prisma.campaignUser.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User is not assigned to this campaign",
      });
    }

    await prisma.campaignUser.delete({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    });

    res.json({
      success: true,
      message: "User removed from campaign",
    });
  } catch (err) {
    console.error("removeUser error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};