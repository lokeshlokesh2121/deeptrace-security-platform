const express = require("express");
const router = express.Router();

const campaignController = require("../controllers/campaign.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware);

router.post("/", campaignController.createCampaign);

router.get("/", campaignController.getCampaigns);

router.get("/:id", campaignController.getCampaignById);

router.put("/:id", campaignController.updateCampaign);

router.delete("/:id", campaignController.deleteCampaign);

router.post(
  "/:id/users",
  authMiddleware,
  roleMiddleware("ADMIN"),
  campaignController.assignUser
);

router.delete(
  "/:id/users/:userId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  campaignController.removeUser
);

module.exports = router;