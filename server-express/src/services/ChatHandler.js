
const IdGenerator = require('./IdGenerator')
const ChatMessageToMongoBD = require('./ChatMessageToMongoDB')
const axios = require('axios')

class ChatHandler {
  constructor(connectionManager, io) {
    (this.connectionManager = connectionManager), (this.io = io);

    // === PRIVATE DEPENDENCIES ===
    this.idGenerator = new IdGenerator()
    this.chatMessageToMongoBD = new ChatMessageToMongoBD()
  
  }

  setupEventListeners(clientSocket) {
    console.log(`Configurando listeners per socket ${clientSocket.id}`);

    clientSocket.on("connected", () => {
      this.handleConnections(clientSocket);
    });

    clientSocket.on("disconnect", (reason) => {
      const clientDisconnectedId = clientSocket.id;
      console.log(`❌ ++++ Disconnessione ${clientSocket.id}: ${reason}`);

      this.handleDisconnections(clientDisconnectedId, reason);
    });

    clientSocket.on("join_room", (data) => {
      console.log(`📥 join_room da ${clientSocket.id}`);
      this.handleJoinRoom(clientSocket, data);
    });
    clientSocket.on("leave_room", (data) => {
      console.log(`📥 leave_room da ${clientSocket.id}`);
      this.handleLeaveRoom(clientSocket, data);
    });
    clientSocket.on("create_room", (data) => {
      console.log(`📥 create_room da ${clientSocket.id}`);
      this.handleCreateRoom(clientSocket, data);
    });

    clientSocket.on("room_message", (data) => {
      console.log(`📥 room_message da ${clientSocket.id}`);
      this.handleRoomMessage(data);
    });

    // Inviamo un messaggio di benvenuto
    clientSocket.emit("welcome", {
      message: "Connesso al server Express - chat attiva",
      timestamp: new Date().toISOString(),
      clientId: clientSocket.id,
    });
  }
  handleConnections(clientSocket) {
    console.log(`nuova connessione ${clientSocket.id}`);

    const registrazione_utente = this.connectionManager.registerClient(
      clientSocket.id
    );

    if (!registrazione_utente) {
      console.log("impossibile registrare utente");
      clientSocket.disconnect();
      return;
    }

    this.setupEventListeners(clientSocket);
    console.log(`Connessione configurata ${clientSocket.id}`);
  }
  handleDisconnections(clientDisconnectedId, reason) {
    console.log(
      `Gestendo disconnessione di ${clientDisconnectedId}, motivo: ${reason}`
    );

    const removed = this.connectionManager.removeClient(clientDisconnectedId);

    if (removed) {
      console.log(
        `✅ Client ${clientDisconnectedId} rimosso. Connessioni attive: ${this.activeConnections}`
      );
    } else {
      console.warn(
        `⚠️ Client ${clientDisconnectedId} non trovato durante disconnessione`
      );
    }
  }
  handleCreateRoom(clientSocket, data) {
    console.log(data);
    const { roomName, userName, topic } = data;

    // DA METTERE UN CONTROLLO SE LA STANZA è GIA PRESENTE!!!

    // controlli inutili che si possono fare a monte
    if (!roomName || !userName) {
      console.warn(`⚠️ Create room con dati incompleti da ${clientSocket.id}`);
      clientSocket.emit("error", {
        message: "Nome room e username sono obbligatori",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log(`🎬 ${userName} (${clientSocket.id}) crea room: ${roomName}`);

    clientSocket.join(roomName);

    clientSocket.emit("room_creation_result", {
      success: true,
      roomName: roomName,
      message: `Room "${roomName}" creata con successo!`,
      topic: topic,
      timestamp: new Date().toISOString(),
    });

    //invio dei dati al registro

    const client_data = {
      roomName: roomName,
      userName,
      userName,
    };

    this.connectionManager.updateClientActivity(
      clientSocket.id,
      "create_room",
      client_data
    );
    this.connectionManager.updateActiveRooms(
      roomName,
      "create_room",
      client_data.userName
    );
  }
  handleJoinRoom(clientSocket, data) {
    const { roomName, userName } = data;

    clientSocket.join(roomName);

    console.log(
      `🏠 ${userName} (${clientSocket.id}) entra in room: ${roomName}`
    );

    //notifico a schermo come messaggio che ha joinato
    clientSocket.emit("room_joined", {
      roomName: roomName,
      message: `Sei entrato nella room: ${roomName}`,
      timestamp: new Date().toISOString(),
    });

    // notifico agli altri partecipanti della chat che ha joinato
    this.io.to(roomName).emit("user_joined", {
      roomName: roomName,
      userName: userName,
      message: `${userName} è entrato nella room`,
      timestamp: new Date().toISOString(),
    });

    const client_data = {
      roomName: roomName,
      userName,
      userName,
    };

    this.connectionManager.updateClientActivity(
      clientSocket.id,
      "join_room",
      client_data
    );
    this.connectionManager.updateActiveRooms(roomName, "join_room", userName);
  }
  handleRoomMessage(data) {
    const { roomName, userName, message } = data;

    console.log(`💬 ${userName} in ${roomName}: ${message}`);

    // Oggetto messaggio completo
    const messageData = {
      userName: userName,
      message: message,
      roomName: roomName,
      timestamp: new Date().toISOString(),
      messageId: this.idGenerator.generateMessageId(),
    };

    // Broadcasting Socket.io nativo a tutta la room
    this.io.to(roomName).emit("room_message_received", messageData);
    //tento di salvare nel mongo db 
    this.chatMessageToMongoBD.saveMessage(messageData);
  }
  handleLeaveRoom(clientSocket, data) {
    const { roomName, userName } = data;

    console.log(
      `🚪 ${userName} (${clientSocket.id}) sta lasciando room: ${roomName}`
    );

    try {
      clientSocket.leave(roomName);

      this.connectionManager.updateClientActivity(
        clientSocket.id,
        "leave_room",
        { roomName, userName }
      );

      this.connectionManager.updateActiveRooms(
        roomName,
        "leave_room",
        userName
      );
      clientSocket.to(roomName).emit("user_left", {
        roomName: roomName,
        userName: userName,
        message: `${userName} ha lasciato la room`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        `❌ Errore durante leave room per ${clientSocket.id}:`,
        error.message
      );
      clientSocket.emit("error", {
        message: "Errore interno del server durante l'uscita dalla room",
        timestamp: new Date().toISOString(),
      });
    }
  }
}
module.exports = ChatHandler;
