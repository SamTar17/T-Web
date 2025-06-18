class RoomController {
  constructor(proxyService) {
    this.proxyService = proxyService;
  }

  async saveRoom(roomData, req, res, next) {
    try {
      const response = await this.proxyService.callMongoDB(
        "/api/rooms",
        "POST",
        roomData
      );

      console.log(
        `✅ Room ${roomData.roomName} creata su MongoDB- status : ${response.status}`
      );

      res.status(204);
    } catch (error) {
      next(error);
    }
  }

  async getRoomList(req, res, next) {
    try {
      const response = await this.proxyService.callMongoDB("/api/rooms/all", "GET");
      console.log(`✅ Recuperate ${response.data.rooms?.length || 0} room`);

      return res.json(response.data);
    } catch (error) {
      next(error);
    }
  }

  async updateRoomActivity(req, res, next) {
    try {
        const roomName = (req.params.roomName);
      const updateData = {
        lastActivity: new Date().toISOString(),
      };

      const response = await this.proxyService.callMongoDB(
        `/api/rooms/${roomName}`,
        "PUT",
        updateData
      );
      res.status(204);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RoomController;
