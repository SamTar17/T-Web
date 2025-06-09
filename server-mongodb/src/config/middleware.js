const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

function configureMiddleware(app) {
    
    app.use(cors({
        origin: [
            "http://localhost:5000", // server chat
            "http://127.0.0.1:5500", // frontend
        ],
        credentials: true // Permette invio cookies/auth headers
    }));

    // Logging delle richieste HTTP per debugging
    app.use(morgan('dev'));
    
    // Parser per JSON nel body delle richieste
    app.use(express.json());
    
    // Parser per form URL-encoded
    app.use(express.urlencoded({ extended: true }));
}

module.exports = configureMiddleware;