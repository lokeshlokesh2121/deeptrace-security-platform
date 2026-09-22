const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware);

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.createUser
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.deleteUser
);

module.exports = router;