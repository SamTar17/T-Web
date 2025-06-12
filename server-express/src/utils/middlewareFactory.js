const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const {
  corsConfig,
  morganConfig,
  jsonConfig,
  urlencodedConfig,
} = require("../config/index");

function useMiddleware(app) {
  app.use(cors(corsConfig));

  // Logging delle richieste HTTP per debugging
  app.use(morgan(morganConfig));

  // Parser per JSON nel body delle richieste
  app.use(express.json(jsonConfig));

  // Parser per form URL-encoded
  app.use(express.urlencoded(urlencodedConfig));
}

module.exports = useMiddleware;
