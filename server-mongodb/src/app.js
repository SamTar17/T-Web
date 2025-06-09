const express = require("express");
const configureMiddleware = require("./config/middleware");
const errorHandler = require("./modules/shared/middleware/errorHandler");
const systemRoutes = require("./routes/system");
const chatRoutes = require('./modules/chat/routes/chatRoutes');
const reviewRoutes = require('./modules/review/routes/reviewRoutes');
const databaseManager = require('./services/DatabaseManager');
const gracefulShutdown =  require("./utils/gracefulShutdown");

const app = express();

configureMiddleware(app);

await databaseManager.connect();

app.use("/api", systemRoutes);
app.use('/api', chatRoutes); 
app.use("/api", reviewRoutes);

app.use(errorHandler);

process.on("SIGINT", () => gracefulShutdown(server, io, healthMonitor));
process.on("SIGTERM",() => gracefulShutdown(server, io, healthMonitor));

module.exports = app;