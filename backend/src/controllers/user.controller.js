const prisma = require("../config/prisma");

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

exports.updateUser = async (req, res) => {

  const user = await prisma.user.findFirst({
    where: {
      id: Number(req.params.id),
      tenantId: req.user.tenantId
    }
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      name: req.body.name,
      role: req.body.role
    }
  });

  res.json(updatedUser);
};

exports.deleteUser = async (req, res) => {

  const user = await prisma.user.findFirst({
    where: {
      id: Number(req.params.id),
      tenantId: req.user.tenantId
    }
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  await prisma.user.delete({
    where: {
      id: user.id
    }
  });

  res.json({
    message: "User deleted successfully"
  });
};