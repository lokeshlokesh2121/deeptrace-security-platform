const express = require("express");
const router = express.Router();

const auditController = require("../controllers/audit.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  auditController.getAuditLogs
);

module.exports = router;