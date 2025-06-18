class ConnectionManager {
  constructor() {
    this.clientsData = new Map();
    this.activeRooms = new Map();
  }

  hasClient(socketId) {
    return this.clientsData.has(socketId);
  }
  getClient(socketId) {
    return this.clientsData.get(socketId);
  }

  // non mi convince particolarmente..
  getActiveRooms() {
    return this.activeRooms;
  }

  registerClient(socketId) {
    if (this.hasClient(socketId)) {
      console.warn(`⚠️ Client ${socketId} già registrato, aggiornamento dati`);
      return false;
    }

    const data = {
      socketId: socketId,
      username: null,
      connectedAt: new Date().toISOString(),
      currentRoom: null,
    };

    this.clientsData.set(socketId, data);

    return true;
  }

  updateClientActivity(socketId, activityType, activityData = {}) {
    const client = this.getClient(socketId);

    if (!client) {
      console.warn(
        `⚠️ Tentativo di aggiornare attività per client inesistente: ${socketId}`
      );
      return false;
    }

    switch (activityType) {
      case "join_room":
      case "create_room":
        client.currentRoom = activityData.roomName;
        client.username = activityData.userName;

        for (const { currentRoom } of this.clientsData.values()) {
          this.activeRooms.set(
            currentRoom,
            (this.activeRooms.get(currentRoom) || 0) + 1
          );
        }
        break;

      case "leave_room":
        client.currentRoom = null;
        for (const { currentRoom } of this.clientsData.values()) {
          this.activeRooms.set(
            currentRoom,
            (this.activeRooms.get(currentRoom) || 0) - 1
          );
        }

        break;

      default:
        console.log(`${activityType}`);
    }

    return true;
  }

  removeClient(socketId) {
    const client = this.getClient(socketId);

    if (!client) {
      console.warn(`⚠️ Tentativo di rimuovere client inesistente: ${socketId}`);
      return false;
    }

    this.clientsData.delete(socketId);

    for (const { currentRoom } of this.clientsData.values()) {
      this.activeRooms.set(
        currentRoom,
        (this.activeRooms.get(currentRoom) || 0) - 1
      );
    }
    return true;
  }
}
//acneh in questo caso singleton che ci deve essere una sola istanza di questo oggetto 

module.exports = new ConnectionManager;
