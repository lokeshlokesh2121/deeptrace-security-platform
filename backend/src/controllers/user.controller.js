const prisma = require("../config/prisma");
const ROLE_OPTIONS = ["ADMIN", "MANAGER", "USER"];

exports.createUser = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      role
    } = req.body;

    const bcrypt = require("bcrypt");

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role,
        tenantId: req.user.tenantId
      }
    });

    res.status(201).json(user);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getUsers = async (req, res) => {

  const users = await prisma.user.findMany({
    where: {
      tenantId: req.user.tenantId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  res.json(users);
};

exports.getUserById = async (req, res) => {

  const user = await prisma.user.findFirst({
    where: {
      id: Number(req.params.id),
      tenantId: req.user.tenantId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  res.json(user);
};
// user.c
exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, role } = req.body;

    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && !ROLE_OPTIONS.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Optional safety: prevent self-demotion from ADMIN
    if (id === req.user.id && role && role !== "ADMIN") {
      return res.status(400).json({
        message: "You cannot remove your own ADMIN role",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.user.tenantId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};