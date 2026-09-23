const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");

// ---------------------------------------------------------
// REGISTER
// ---------------------------------------------------------
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, tenantId } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role,
        tenantId
      }
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------
// LOGIN  (only ONE login handler — this is the correct one)
// ---------------------------------------------------------
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

    // ✅ Use the named export — NOT jwt(user)
    const token = jwt.generateToken(user);

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

// ---------------------------------------------------------
// ME
// ---------------------------------------------------------
exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------
// AUDIT LOGS
// ---------------------------------------------------------
exports.getAuditLogs = async (req, res) => {
  try {
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

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};