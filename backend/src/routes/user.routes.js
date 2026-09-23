const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware); // ← only once

// View Users
router.get(
  "/",
  roleMiddleware("ADMIN", "MANAGER", "USER"),
  userController.getUsers
);

router.get(
  "/:id",
  roleMiddleware("ADMIN", "MANAGER", "USER"),
  userController.getUserById
);

// Create User — ADMIN only
router.post(
  "/",
  roleMiddleware("ADMIN"),
  userController.createUser
);

// Update User — ADMIN only
router.put(
  "/:id",
  roleMiddleware("ADMIN"),
  userController.updateUser
);

// Delete User — ADMIN only
router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  userController.deleteUser
);

module.exports = router;