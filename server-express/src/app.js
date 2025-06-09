require("dotenv").config();

const express = require("express");
const http = require("http");
const configureMiddleware = require("./config/middleware");
const createSocketServer = require("./config/socketServer");
const ConnectionManager = require("./services/ConnectionManager");
const HealthMonitor = require("./services/HealthServiceMonitor");
const ChatHandler = require("./services/ChatHandler");
const errorHandler = require("./middleware/errorHandler");
const { router: debugRoutes, setConnectionManager } = require("./routes/debug");
const movieRoutes = require("./routes/movies");

//================================================


const app = express();
const server = http.createServer(app);

//========= SETUP E CONFIGURAZIONI =======
configureMiddleware(app);

const healthMonitor = new HealthMonitor();
const io = createSocketServer(server);
console.log("🔌 Socket.io inizializzato e configurato");

const connectionManager = new ConnectionManager();
const chatHandler = new ChatHandler(connectionManager, io);
setConnectionManager(connectionManager); //debug

console.log("📊 ConnectionManager creato");
console.log("💬 ChatHandler configurato");

io.on("connection", (clientSocket) => {
  console.log(`🔗 Nuova connessione Socket.io: ${clientSocket.id}`);
  chatHandler.handleConnections(clientSocket);
});

app.use("/api/debug", debugRoutes);
app.use("/api", movieRoutes);

app.get("/api/services/health", (req, res) => {
  const status = healthMonitor.getHealthSummary();
  res.json(status);
});

app.use(errorHandler);

console.log("🚀 Avvio ServiceHealthMonitor...");
healthMonitor.start();

const gracefulShutdown =  require("./utils/gracefulShutdown");


process.on("SIGINT", () => gracefulShutdown(server, io, healthMonitor));
process.on("SIGTERM",() => gracefulShutdown(server, io, healthMonitor));

// ✅ Esporta solo il server per `server.listen(...)`
module.exports = server;
