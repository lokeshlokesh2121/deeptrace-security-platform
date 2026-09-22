const express = require("express");
const router = express.Router();

const eventController = require("../controllers/event.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/", eventController.createEvent);

router.get("/", eventController.getEvents);

router.get("/:id", eventController.getEventById);

router.put("/:id", eventController.updateEvent);

router.delete("/:id", eventController.deleteEvent);

module.exports = router;