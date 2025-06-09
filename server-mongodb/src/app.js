const express = require("express");
const configureMiddleware = require("./config/middleware");
const errorHandler = require("./modules/shared/middleware/errorHandler");
const systemRoutes = require("./routes/system");
// app.js
const chatRoutes = require('./modules/chat/routes/chatRoutes');


// Import configurazione database
const databaseManager = require('./services/DatabaseManager');

const app = express();

/**
 * FASE 1: Configurazione Middleware Base
 */
configureMiddleware(app);


/**
 * FASE 3: Configurazione Routes
 */
app.use("/api", systemRoutes);
app.use('/api', chatRoutes); // POST /api/messages
// TODO: Prossimo step - aggiungere messageRoutes
// app.use("/api", messageRoutes);

/**
 * FASE 4: Error Handler (sempre ultimo middleware)
 */
app.use(errorHandler);

// Export del server configurato
module.exports = { app, databaseManager };