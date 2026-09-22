const prisma = require("../config/prisma");

exports.createCampaign = async (req, res) => {

  try {

    const {
      name,
      description
    } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        status: "DRAFT",
        tenantId: req.user.tenantId
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_CAMPAIGN",
        entity: "CAMPAIGN",
        entityId: campaign.id,
        userId: req.user.userId,
        tenantId: req.user.tenantId
      }
    });

    res.status(201).json(campaign);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getCampaigns = async (req, res) => {

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const campaigns = await prisma.campaign.findMany({
    where: {
      tenantId: req.user.tenantId
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(campaigns);
};


exports.getCampaignById = async (req, res) => {

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(req.params.id),
      tenantId: req.user.tenantId
    }
  });

  if (!campaign) {
    return res.status(404).json({
      message: "Campaign not found"
    });
  }

  res.json(campaign);
};


exports.updateCampaign = async (req, res) => {

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(req.params.id),
      tenantId: req.user.tenantId
    }
  });

  if (!campaign) {
    return res.status(404).json({
      message: "Campaign not found"
    });
  }

  const updated = await prisma.campaign.update({
    where: {
      id: campaign.id
    },
    data: req.body
  });

  res.json(updated);
};


exports.deleteCampaign = async (req, res) => {

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: Number(req.params.id),
      tenantId: req.user.tenantId
    }
  });

  if (!campaign) {
    return res.status(404).json({
      message: "Campaign not found"
    });
  }

  await prisma.campaign.delete({
    where: {
      id: campaign.id
    }
  });

  res.json({
    success: true
  });
};


exports.assignUser = async (req, res) => {

  const campaignId = Number(req.params.id);
  const { userId } = req.body;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      tenantId: req.user.tenantId
    }
  });

  if (!campaign) {
    return res.status(404).json({
      message: "Campaign not found"
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: req.user.tenantId
    }
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  const assignment = await prisma.campaignUser.create({
    data: {
      campaignId,
      userId
    }
  });

  res.json(assignment);
};


exports.removeUser = async (req, res) => {
  try {
    const campaignId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId: req.user.tenantId
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    await prisma.campaignUser.delete({
      where: {
        campaignId_userId: {
          campaignId,
          userId
        }
      }
    });

    res.json({
      message: "User removed from campaign"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

