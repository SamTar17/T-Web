const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const app = express();



activeRooms = new Map()


app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

// Route per la dashboard (homepage)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// Route dinamica per le stanze
app.get("/room/:roomName", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/room.html"));
});

app.get("/api/rooms", (req, res) => {
  //secondo me se creo un json a monte posso evitare sta roba in realtà no zitto

  const roomsList = Array.from(activeRooms.values()).map((room) => ({
    name: room.name,
    userCount: room.users.length,
    users: room.users,
    createdAt: room.createdAt,
    topic: room.topic,
    creator: room.creator,
  }));

  res.json({
    success: true,
    rooms: roomsList,
    totalRooms: roomsList.length,
    timestamp: new Date().toISOString(),
  });
});



//Setup socketio

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New user connected:", socket.id);

  //evento di log manda dati al front
  socket.emit("welcome", {
    message: "Benvenuto al server chat!",
    timestamp: new Date().toISOString(),
  });

  //setup eventi

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });

  // eventi stanze

  socket.on("create_room", (data) => {
    console.log(`!!! create room ${data.originalClientId}`)
    const { roomName, userName, topic, originalClientId } = data;

    console.log(
      `🎬 ${userName} creating new room: ${roomName} (topic: ${topic} ${originalClientId})`
    );

    // Questo secondo me va gestito diversamente! se la stanza è già presente viene controllata con il nome stanza ma non va bene secondo me
    if (activeRooms.has(roomName)) {
      // Non Confermiamo la creazione e rindiriziamo l utente alla stanza gia presente
      socket.emit("room_creation_result", {
        success: false,
        message: `La stanza "${roomName}" esiste già. Ti stiamo facendo entrare...`,
        roomName: roomName,
      });

      // Facciamo entrare l'utente nella stanza esistente
      socket.join(roomName);
      const room = activeRooms.get(roomName);

      if (!room.users.includes(userName)) {
        room.users.push(userName);
      }

      return;
    }

    activeRooms.set(roomName, {
      name: roomName,
      users: [userName],
      createdAt: new Date().toISOString(),
      topic: topic,
      creator: userName,
    });

    socket.join(roomName);

    console.log(`✅ Stanza "${roomName}" creata con successo!`);
    console.log(`📊 Stanze attive totali: ${activeRooms.size}`);

    // Confermiamo la creazione
    socket.emit("room_creation_result", {
      success: true,
      message: `Stanza "${roomName}" creata con successo!`,
      roomName: roomName,
      topic: topic,
      originalClientId: originalClientId,
    });

    // Notifichiamo che l'utente è entrato (anche se è solo lui per ora)
    socket.emit("room_joined", {
      roomName: roomName,
      message: `+++ Benvenuto nella tua TUA stanza: ${roomName} +++`,
      timestamp: new Date().toISOString(),
      originalClientId: originalClientId,
    });
  });



  //evento per joinare una stanza, arriveranno dei dati a questo evento come room name e nickname

  socket.on("join_room", (data) => {
    console.log(data)
    const { roomName, userName, originalClientId } = data;
    console.log(`👤 ${userName} (${originalClientId}) joining room: ${roomName}`);

    //la connessione joina la stanza
    socket.join(roomName);

    //aggiorno le activeRooms con il nuovo utente

    const room = activeRooms.get(roomName);
    if (!room.users.includes(userName)) {
      room.users.push(userName);
    }

    console.log(
      `📊 Stanza ${roomName} ora ha ${room.users.length} utenti:`,
      room.users
    );

    socket.emit("room_joined", {
      roomName: roomName,
      message: `Ti sei unito a: ${roomName}`,
      timestamp: new Date().toISOString(),
      originalClientId: originalClientId,
    });

    //invia dati log utenti alla stanza
    socket.to(roomName).emit("user_joined", {
      roomName: roomName,
      message: `${userName} è entrato nella stanza`,
      timestamp: new Date().toISOString(),
      originalClientId: originalClientId
    });
  });

  // Eventi messaggistica

  socket.on("room_message", (data) => {
    const { roomName, userName, message } = data;
    console.log(`💬 Message in ${roomName} from ${userName}: ${message}`);

    const messageData = {
      userName: userName,
      message: message,
      timestamp: new Date().toISOString(),
      roomName: roomName,
    };
    //questo lo invia a tutte le room !!!! non si mette socket.to perchè senno il messaggio NON viene inviato all utente nella connessione socket
    io.to(roomName).emit("room_message_received", messageData);
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "Chat server is running",
    timestamp: new Date().toISOString(),
    service: "chat-microservice",
  });
});

//ENDPOINT PER VISUALIZZARE LE STANZE!

module.exports = server;
