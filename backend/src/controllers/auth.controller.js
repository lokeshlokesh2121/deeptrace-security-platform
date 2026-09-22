const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      tenantId
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
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
      message: "User registered successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.generateToken({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId
    });

    res.json({
      token
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.me = async (req, res) => {

  const user = await prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true
    }
  });

  res.json(user);
};