const express = require("express");
const configureMiddleware = require("./config/middleware");
const errorHandler = require("./modules/shared/middleware/errorHandler");
const systemRoutes = require("./routes/system");
const chatRoutes = require('./modules/chat/routes/chatRoutes');
const reviewRoutes = require('./modules/reviews/routes/reviewRoutes');
const databaseManager = require('./services/DatabaseManager');

const app = express();

// === CONFIGURAZIONE APP EXPRESS ===

// Middleware base
configureMiddleware(app);

// Routes
app.use("/api", systemRoutes);
app.use('/api', chatRoutes); 
app.use("/api", reviewRoutes);

// Error handler (sempre ultimo)
app.use(errorHandler);

// === EXPORT ===
module.exports = { app, databaseManager };