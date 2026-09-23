const express = require("express");
const router = express.Router();

const campaignController = require("../controllers/campaign.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware); // sets req.user

router.get(
  "/",
  roleMiddleware("ADMIN", "MANAGER", "USER"),
  campaignController.getCampaigns
);

router.get(
  "/:id",
  roleMiddleware("ADMIN", "MANAGER", "USER"),
  campaignController.getCampaignById
);

router.post(
  "/",
  roleMiddleware("ADMIN", "MANAGER"),
  campaignController.createCampaign
);

router.put(
  "/:id",
  roleMiddleware("ADMIN", "MANAGER"),
  campaignController.updateCampaign
);

router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  campaignController.deleteCampaign
);

// ---- User assignment ----
router.post(
  "/:id/users",
  campaignController.assignUser
);

router.delete(
  "/:id/users/:userId",
  campaignController.removeUser
);

module.exports = router;