const express = require("express");
const RoomController = require("../controllers/roomController");
const ProxyCallerServices = require("../services/ProxyCallerServices");

const router = express.Router();
const proxyCallerServices = new ProxyCallerServices();
const roomController = new RoomController(proxyCallerServices);

router.get(
  "/rooms/all",
  roomController.getRoomList.bind(roomController)
);

router.put("/rooms/:roomName",
  roomController.updateRoomActivity.bind(roomController)
)



module.exports = router;