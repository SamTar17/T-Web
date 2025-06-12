const express = require("express");
const {
  saveMessage,
  getLatestMessages,
  getMessagesBefore,
  saveRoom,
  getAllRooms,
  updateActivity,
} = require("../controllers/chatController");

const router = express.Router();

router.post("/messages", saveMessage);
router.get("/messages/:roomName", getLatestMessages);
router.get("/messages/:roomName/before/:timestamp", getMessagesBefore);

router.post("/rooms", saveRoom);
router.get("/rooms/all", getAllRooms);
router.put("/rooms/:roomName", updateActivity);

module.exports = router;
