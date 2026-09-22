const prisma = require("../config/prisma");

exports.createEvent = async (req, res) => {

  const event = await prisma.securityEvent.create({
    data: {
      ...req.body,
      tenantId: req.user.tenantId
    }
  });

  res.status(201).json(event);
};


exports.getEvents = async (req, res) => {

  const {
    severity,
    status,
    page = 1,
    limit = 10
  } = req.query;

  const where = {
    tenantId: req.user.tenantId
  };

  if (severity) {
    where.severity = severity;
  }

  if (status) {
    where.status = status;
  }

  const events = await prisma.securityEvent.findMany({
    where,
    skip: (page - 1) * limit,
    take: Number(limit),
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(events);
};

exports.getEventById = async (req, res) => {
  try {
    const event = await prisma.securityEvent.findFirst({
      where: {
        id: Number(req.params.id),
        tenantId: req.user.tenantId
      }
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.json(event);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {

    const event = await prisma.securityEvent.findFirst({
      where: {
        id: Number(req.params.id),
        tenantId: req.user.tenantId
      }
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const updated = await prisma.securityEvent.update({
      where: {
        id: event.id
      },
      data: req.body
    });

    res.json(updated);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {

    const event = await prisma.securityEvent.findFirst({
      where: {
        id: Number(req.params.id),
        tenantId: req.user.tenantId
      }
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    await prisma.securityEvent.delete({
      where: {
        id: event.id
      }
    });

    res.json({
      success: true
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};