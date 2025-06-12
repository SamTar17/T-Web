require("dotenv").config();

const express = require("express");
const http = require("http");

const configureMiddleware = require("./utils/middlewareFactory");
const createSocketServer = require("./utils/socketServerFactory");
//const ChatHandler = require("./services/ChatHandler");
const errorHandler = require("./middleware/errorHandler");
const movieRoutes = require("./routes/moviesRoutes");
const gracefulShutdown =  require("./utils/gracefulShutdown");

//================================================


const app = express();
const server = http.createServer(app);

//========= SETUP E CONFIGURAZIONI =======
configureMiddleware(app);

const io = createSocketServer(server);
console.log("🔌 Socket.io inizializzato e configurato");

//const chatHandler = new ChatHandler(connectionManager, io);

console.log("📊 ConnectionManager creato");
console.log("💬 ChatHandler configurato");

io.on("connection", (clientSocket) => {
  console.log(`🔗 Nuova connessione Socket.io: ${clientSocket.id}`);
  chatHandler.handleConnections(clientSocket);
});

app.use("/api", movieRoutes);

app.use(errorHandler);

process.on("SIGINT", () => gracefulShutdown(server, io));
process.on("SIGTERM",() => gracefulShutdown(server, io));

// ✅ Esporta solo il server per `server.listen(...)`
module.exports = server;
