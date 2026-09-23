const prisma = require("../config/prisma");

// ---------------------------------------------------------
// ENUMS & TRANSITION RULES
// ---------------------------------------------------------
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const ALLOWED_STATUS_TRANSITIONS = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: []
};

const isValidSeverity = (s) => SEVERITIES.includes(s);
const isValidStatus = (s) => STATUSES.includes(s);

const canTransition = (current, next) => {
  if (current === next) return true;
  return (ALLOWED_STATUS_TRANSITIONS[current] || []).includes(next);
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
      entity: "EVENT",
      entityId,
      userId,
      tenantId
    }
  });
};

// ---------------------------------------------------------
// CREATE EVENT
// ---------------------------------------------------------
exports.createEvent = async (req, res) => {
  try {
    const { eventType, severity, status, description } = req.body;

    if (!eventType || !eventType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event type is required"
      });
    }

    if (severity && !isValidSeverity(severity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid severity"
      });
    }

    if (status && !isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const event = await prisma.securityEvent.create({
      data: {
        eventType: eventType.trim(),
        severity: severity || "LOW",
        status: status || "OPEN",
        description: description?.trim() || null,
        tenantId: req.user.tenantId
      }
    });

    await writeAuditLog({
      action: "CREATE_EVENT",
      entityId: event.id,
      userId: req.user.userId,
      tenantId: req.user.tenantId
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------
// LIST EVENTS (paginated)
// ---------------------------------------------------------
exports.getEvents = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const severity = (req.query.severity || "").trim();
    const status = (req.query.status || "").trim();

    const where = {
      tenantId: req.user.tenantId
    };

    if (severity) {
      if (!isValidSeverity(severity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid severity filter"
        });
      }
      where.severity = severity;
    }

    if (status) {
      if (!isValidStatus(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter"
        });
      }
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.securityEvent.count({ where })
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------
// GET EVENT BY ID
// ---------------------------------------------------------
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
        success: false,
        message: "Event not found"
      });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------
// UPDATE EVENT
// ---------------------------------------------------------
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
        success: false,
        message: "Event not found"
      });
    }

    const { severity, status, description, eventType } = req.body;
    const data = {};

    if (eventType !== undefined) {
      if (!eventType.trim()) {
        return res.status(400).json({
          success: false,
          message: "Event type cannot be empty"
        });
      }
      data.eventType = eventType.trim();
    }

    if (severity !== undefined) {
      if (!isValidSeverity(severity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid severity"
        });
      }
      data.severity = severity;
    }

    if (description !== undefined) {
      data.description = description?.trim() || null;
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status"
        });
      }

      if (!canTransition(event.status, status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${event.status} to ${status}`
        });
      }

      data.status = status;
    }

    const updated = await prisma.securityEvent.update({
      where: { id: event.id },
      data
    });

    await writeAuditLog({
      action: "UPDATE_EVENT",
      entityId: updated.id,
      userId: req.user.userId,
      tenantId: req.user.tenantId
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------
// DELETE EVENT
// ---------------------------------------------------------
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
        success: false,
        message: "Event not found"
      });
    }

    await prisma.securityEvent.delete({
      where: { id: event.id }
    });

    await writeAuditLog({
      action: "DELETE_EVENT",
      entityId: event.id,
      userId: req.user.userId,
      tenantId: req.user.tenantId
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};