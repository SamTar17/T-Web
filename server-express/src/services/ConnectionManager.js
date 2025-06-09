class ConnectionManager {
  constructor() {
    this.clientsData = new Map();
    this.activeRooms = new Map();
    this.stats = {
      totalConnections: 0,
      currentConnections: 0,
    };
    console.log("📊 ConnectionManager inizializzato");
  }

  hasClient(socketId) {
    return this.clientsData.has(socketId);
  }
  getClient(socketId) {
    return this.clientsData.get(socketId);
  }

  // non mi convince particolarmente..
  getActiveRooms() {
    return {
      room: this.activeRooms,
    };
  }

  getStats() {
    return {
      totalConnections: this.totalConnections,
      currentConnections: this.currentConnections,
      activeRooms: this.activeRooms,
    };
  }

  registerClient(socketId, initialData = {}) {
    if (this.hasClient(socketId)) {
      console.warn(`⚠️ Client ${socketId} già registrato, aggiornamento dati`);
      return false;
    }

    const data = {
      // Identificatori
      socketId: socketId,
      username: null,
      connectedAt: new Date().toISOString(),
      currentRoom: null,
    };

    this.clientsData.set(socketId, data);
    //statistiche globali
    this.stats.totalConnections += 1;
    this.stats.currentConnections += 1;

    console.log(`✅ Client registrato: ${socketId} (${data.username})`);
    console.log(`📊 Connessioni attuali: ${this.stats.currentConnections}`);

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

    // Gestiamo diversi tipi di attività connessione e disconnessione da una stanza
    switch (activityType) {
      case "join_room":
      case "create_room":
        client.currentRoom = activityData.roomName;
        client.username = activityData.userName;

        console.log(
          `🏠 ${client.username} è entrato in room: ${activityData.roomName}`
        );
        break;

      case "leave_room":
        client.currentRoom = null;
        console.log(`🚪 ${client.username} ha lasciato la room`);
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
    this.stats.currentConnections -= 1;
    console.log(`❌ Client rimosso: ${client.username} (${socketId})`);
    console.log(`📊 Rimanenti connessi: ${this.clientsData.size}`);
    return true;
  }

  updateActiveRooms(roomName, activityType, userName) {
    if (activityType === "create_room") {
      this.activeRooms.set(roomName, {
        userNameCreator: userName,
        userNameList: [userName],
      });
      console.log(this.activeRooms)
      //da implementare
    } else if (activityType === "join_room") {
      const room = this.activeRooms.get(roomName);
      room.userNameList.push(userName);
    } else if (activityType === 'leave_room'){
      const room = this.activeRooms.get(roomName);
      const index = nomi.indexOf(userName);
        if (index !== -1) {
          room.userNameList.splice(index, 1);
        }
    }
  }
}

module.exports = ConnectionManager;
