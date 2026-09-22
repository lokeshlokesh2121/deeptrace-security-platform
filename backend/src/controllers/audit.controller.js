const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt(user);

    await prisma.auditLog.create({
      data: {
        action: "LOGIN",
        entity: "USER",
        entityId: user.id,
        userId: user.id,
        tenantId: user.tenantId
      }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getAuditLogs = async (req, res) => {

  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId: req.user.tenantId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(logs);
};